import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { confirmPayment } from "./client";
import db from "../db";

export interface ConfirmPaymentRequest {
  inquiryId: string;
  transactionId: string;
}

export interface ConfirmPaymentResponse {
  orderId: string;
  trxNumber: string;
  trxDateOrder: string;
  trxItem: string;
  trxPrice: string;
  trxStatus: string;
}

export const confirmPaymentEndpoint = api<ConfirmPaymentRequest, ConfirmPaymentResponse>(
  { expose: true, method: "POST", path: "/uniplay/confirm-payment", auth: true },
  async ({ inquiryId, transactionId }) => {
    const auth = getAuthData()!;
    
    const configRow = await db.queryRow<{ value: string }>`
      SELECT value FROM admin_config WHERE key = 'dashboard_config'
    `;

    if (!configRow) {
      throw new Error("UniPlay configuration not found");
    }

    const config = JSON.parse(configRow.value);
    const pincode = config.uniplay?.pincode;

    if (!pincode) {
      throw new Error("UniPlay pincode not configured");
    }

    const response = await confirmPayment({
      inquiry_id: inquiryId,
      pincode: pincode,
    });

    if (response.status !== "200") {
      throw new Error(response.message || "Payment confirmation failed");
    }

    await db.exec`
      UPDATE transactions
      SET uniplay_order_id = ${response.order_id}
      WHERE id = ${transactionId}
    `;

    return {
      orderId: response.order_id,
      trxNumber: response.order_info.trx_number,
      trxDateOrder: response.order_info.trx_date_order,
      trxItem: response.order_info.trx_item,
      trxPrice: response.order_info.trx_price,
      trxStatus: response.order_info.trx_status,
    };
  }
);
