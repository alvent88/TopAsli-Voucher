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
        clerk_user_id: string;
        status: string;
      }>`
        SELECT id, clerk_user_id, status
        FROM transactions
        WHERE id = ${req.transactionId}
      `;

      if (!transaction) {
        throw APIError.notFound("Transaction not found");
      }

      if (transaction.clerk_user_id !== auth.userID) {
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

      // Send WhatsApp notification and email receipt after successful payment
      try {
        console.log("=== SENDING NOTIFICATIONS ===");
        
        const transactionData = await db.queryRow<{
          user_id: string;
          game_id: string;
          product_name: string;
          package_name: string;
          price: number;
          username: string | null;
        }>`
          SELECT 
            t.user_id, 
            t.game_id,
            pr.name as product_name,
            pk.name as package_name,
            t.price,
            t.username
          FROM transactions t
          INNER JOIN products pr ON t.product_id = pr.id
          INNER JOIN packages pk ON t.package_id = pk.id
          WHERE t.id = ${req.transactionId}
        `;

        console.log("Transaction data loaded:", transactionData);

        const { createClerkClient } = await import("@clerk/backend");
        const { secret } = await import("encore.dev/config");
        const clerkSecretKey = secret("ClerkSecretKey");
        const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

        const user = await clerkClient.users.getUser(auth.userID);
        const phoneNumber = (user.publicMetadata?.phoneNumber as string) || "";
        const fullName = (user.unsafeMetadata?.fullName as string) || user.firstName || "Customer";
        const email = user.emailAddresses[0]?.emailAddress || "";

        console.log("User data - Phone:", phoneNumber, "Name:", fullName, "Email:", email);

        // Send WhatsApp if phone number is available
        if (phoneNumber && transactionData) {
          const configRow = await db.queryRow<{ value: string }>`
            SELECT value FROM admin_config WHERE key = 'dashboard_config'
          `;

          console.log("Config loaded:", configRow ? "Yes" : "No");

          if (configRow) {
            const config = JSON.parse(configRow.value);
            const fonnteToken = config.whatsapp?.fonnteToken || "";

            console.log("Fonnte token found:", fonnteToken ? "Yes" : "No");

            if (!fonnteToken) {
              console.log("⚠️ Fonnte token not configured, skipping WhatsApp");
            } else {
              let formattedPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "").replace(/-/g, "");
              
              if (formattedPhone.startsWith("0")) {
                formattedPhone = "62" + formattedPhone.substring(1);
              } else if (!formattedPhone.startsWith("62")) {
                formattedPhone = "62" + formattedPhone;
              }

              const formatCurrency = (amount: number) => {
                return new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(amount);
              };

              const usernameInfo = transactionData.username ? `Username: ${transactionData.username}\n` : '';
              const message = `✅ *PEMBELIAN BERHASIL - TopAsli*\n\nHalo ${fullName},\n\nPembelian Anda telah berhasil diproses!\n\n📦 *Detail Pembelian*\nProduk: ${transactionData.product_name}\nPaket: ${transactionData.package_name}\nHarga: ${formatCurrency(transactionData.price)}\n\n🎮 *Akun Game*\n${usernameInfo}User ID: ${transactionData.user_id}\nGame ID: ${transactionData.game_id}\n\n💰 *Pembayaran*\nTotal: ${formatCurrency(transactionData.price)}\nSisa Saldo: ${formatCurrency(newBalance)}\n\n🆔 *ID Transaksi*\n${req.transactionId}\n\n⚠️ Item telah diproses dan dikirim ke akun game Anda.\n\nKami dengan senang hati melayani kebutuhan top-up Anda. 🙏`;

              const formData = new URLSearchParams();
              formData.append('target', formattedPhone);
              formData.append('message', message);
              formData.append('countryCode', '62');

              console.log("📱 Sending WhatsApp confirmation...");
              console.log("Target phone:", formattedPhone);
              
              const waResponse = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                  'Authorization': fonnteToken,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
              });

              const waData = await waResponse.json() as any;
              console.log("📱 WhatsApp API Response:", JSON.stringify(waData, null, 2));
              
              if (waResponse.ok && waData.status !== false) {
                console.log("✅ WhatsApp sent successfully!");
              } else {
                console.error("❌ WhatsApp failed:", waData.reason || waData.message || "Unknown error");
              }
            }
          } else {
            console.log("⚠️ Fonnte token not configured, skipping WhatsApp");
          }
        } else {
          if (!phoneNumber) {
            console.log("⚠️ No phone number found, skipping WhatsApp");
          }
          if (!transactionData) {
            console.log("⚠️ No transaction data found, skipping WhatsApp");
          }
        }
      } catch (notificationErr) {
        console.error("❌ Failed to send WhatsApp notification:", notificationErr);
      }

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
