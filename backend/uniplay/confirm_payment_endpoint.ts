import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { confirmPayment, UniPlayConfirmPaymentResponse } from "./client";

export interface ConfirmPaymentRequest {
  inquiryId: string;
  transactionId: string;
}

export interface ConfirmPaymentEndpointResponse {
  success: boolean;
  orderId: string;
  orderInfo: {
    trxNumber: string;
    trxDateOrder: string;
    trxItem: string;
    trxPrice: string;
    trxStatus: string;
  };
  message?: string;
}

export const confirmPaymentEndpoint = api<ConfirmPaymentRequest, ConfirmPaymentEndpointResponse>(
  { expose: true, method: "POST", path: "/uniplay/confirm-payment-endpoint", auth: true },
  async (req: ConfirmPaymentRequest) => {
    const auth = getAuthData()!;

    try {
      console.log("=== Confirm Payment Endpoint ===");
      console.log("User ID:", auth.userID);
      console.log("Inquiry ID:", req.inquiryId);
      console.log("Transaction ID:", req.transactionId);

      // Verify transaction belongs to user
      const transaction = await db.queryRow<{
        id: number;
        user_id: string;
        status: string;
      }>`
        SELECT id, user_id, status
        FROM transactions
        WHERE id = ${req.transactionId}
      `;

      if (!transaction) {
        throw APIError.notFound("Transaction not found");
      }

      if (transaction.user_id !== auth.userID) {
        throw APIError.permissionDenied("Transaction does not belong to user");
      }

      if (transaction.status !== "pending") {
        throw APIError.invalidArgument(`Transaction status is ${transaction.status}, expected pending`);
      }

      // Get pincode from config
      const config = await db.queryRow<{ value: string }>`
        SELECT value FROM admin_config WHERE key = 'dashboard_config'
      `;

      if (!config) {
        throw APIError.internal("UniPlay config not found");
      }

      const dashboardConfig = JSON.parse(config.value);
      if (!dashboardConfig.uniplay?.pincode) {
        throw APIError.internal("UniPlay pincode not configured in admin config");
      }

      const pincode = dashboardConfig.uniplay.pincode;

      console.log("Calling UniPlay confirm-payment...");
      const response = await confirmPayment({
        inquiry_id: req.inquiryId,
        pincode: pincode,
      });

      console.log("UniPlay response:", JSON.stringify(response, null, 2));

      if (response.status !== "200") {
        throw APIError.internal(`UniPlay API error: ${response.message}`);
      }

      if (!response.order_id) {
        throw APIError.internal("No order_id in UniPlay response");
      }

      // Get transaction details to deduct balance
      const transactionDetails = await db.queryRow<{
        price: number;
      }>`
        SELECT price
        FROM transactions
        WHERE id = ${req.transactionId}
      `;

      if (!transactionDetails) {
        throw APIError.internal("Transaction details not found");
      }

      // Deduct balance
      const userBalance = await db.queryRow<{ balance: number }>`
        SELECT balance FROM user_balance WHERE user_id = ${auth.userID}
      `;

      const balance = userBalance?.balance || 0;
      const newBalance = balance - transactionDetails.price;

      if (newBalance < 0) {
        throw APIError.invalidArgument(`Insufficient balance. Your balance: Rp ${balance.toLocaleString('id-ID')}, Price: Rp ${transactionDetails.price.toLocaleString('id-ID')}`);
      }

      await db.exec`
        UPDATE user_balance
        SET balance = ${newBalance}
        WHERE user_id = ${auth.userID}
      `;

      console.log(`Balance updated: ${balance} -> ${newBalance}`);

      // Update transaction with UniPlay order_id
      await db.exec`
        UPDATE transactions
        SET 
          uniplay_order_id = ${response.order_id},
          status = 'success',
          updated_at = NOW()
        WHERE id = ${req.transactionId}
      `;

      console.log("✅ Transaction updated with order_id:", response.order_id);

      return {
        success: true,
        orderId: response.order_id,
        orderInfo: {
          trxNumber: response.order_info.trx_number,
          trxDateOrder: response.order_info.trx_date_order,
          trxItem: response.order_info.trx_item,
          trxPrice: response.order_info.trx_price,
          trxStatus: response.order_info.trx_status,
        },
        message: "Payment confirmed successfully",
      };
    } catch (err: any) {
      console.error("❌ Confirm payment failed:", err);

      // Update transaction status to failed
      try {
        await db.exec`
          UPDATE transactions
          SET status = 'failed', updated_at = NOW()
          WHERE id = ${req.transactionId}
        `;
      } catch (updateErr) {
        console.error("Failed to update transaction status:", updateErr);
      }
      
      if (err.code) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Failed to confirm payment");
    }
  }
);
