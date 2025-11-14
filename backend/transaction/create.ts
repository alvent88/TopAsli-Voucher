import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { nanoid } from "nanoid";
import { transactionTopic } from "../notification/events";
import { createOrder as createUniPlayOrder } from "../uniplay/client";

interface CreateTransactionParams {
  productId: number;
  packageId: number;
  paymentMethodId?: number;
  userId: string;
  gameId?: string;
  inquiryId?: string;
  username?: string;
}

interface CreateTransactionResponse {
  id: string;
  total: number;
  status: string;
  transactionId: string;
}

export const create = api<CreateTransactionParams, CreateTransactionResponse>(
  { expose: true, method: "POST", path: "/transactions", auth: true },
  async ({ productId, packageId, paymentMethodId = 1, userId, gameId = "", inquiryId, username }) => {
    const auth = getAuthData()!;
    
    console.log("=== CREATE TRANSACTION START ===");
    console.log("User ID:", auth.userID);
    console.log("Product ID:", productId);
    console.log("Package ID:", packageId);
    console.log("Payment Method ID:", paymentMethodId);
    console.log("Inquiry ID:", inquiryId);
    
    const pkg = await db.queryRow<{ price: number; name: string; amount: number; unit: string }>`
      SELECT price, name, amount, unit FROM packages WHERE id = ${packageId} AND product_id = ${productId} AND is_active = true
    `;

    if (!pkg) {
      throw APIError.invalidArgument("Paket tidak ditemukan atau tidak aktif");
    }

    const product = await db.queryRow<{ name: string }>`
      SELECT name FROM products WHERE id = ${productId}
    `;

    if (!product) {
      throw APIError.invalidArgument("Produk tidak ditemukan");
    }

    const userBalance = await db.queryRow<{ balance: number }>`
      SELECT balance FROM user_balance WHERE user_id = ${auth.userID}
    `;

    const balance = userBalance?.balance || 0;

    if (balance < pkg.price) {
      throw APIError.invalidArgument(`Saldo tidak mencukupi. Saldo Anda: Rp ${balance.toLocaleString('id-ID')}, Harga: Rp ${pkg.price.toLocaleString('id-ID')}`);
    }

    const paymentMethod = await db.queryRow<any>`
      SELECT fee_percent, fee_fixed FROM payment_methods WHERE id = ${paymentMethodId} AND is_active = true
    `;

    if (!paymentMethod) {
      throw APIError.invalidArgument("Metode pembayaran tidak valid");
    }

    const price = pkg.price;
    const fee = Math.round(price * paymentMethod.fee_percent / 100) + paymentMethod.fee_fixed;
    const total = price + fee;
    const transactionId = `TRX${Date.now()}`;
    
    // Use 'pending' status if inquiryId is provided (new flow), otherwise 'success' (old flow)
    const status = inquiryId ? 'pending' : 'success';

    await db.exec`
      INSERT INTO transactions (id, product_id, package_id, payment_method_id, user_id, game_id, amount, price, fee, total, status, clerk_user_id, username)
      VALUES (${transactionId}, ${productId}, ${packageId}, ${paymentMethodId}, ${userId}, ${gameId}, ${pkg.price}, ${price}, ${fee}, ${total}, ${status}, ${auth.userID}, ${username || null})
    `;

    // Calculate new balance for display (even if not deducted yet in pending status)
    const newBalance = balance - price;
    
    // Only deduct balance if status is 'success' (old flow)
    // In new flow, balance will be deducted after confirm payment
    if (status === 'success') {
      await db.exec`
        UPDATE user_balance
        SET balance = ${newBalance}
        WHERE user_id = ${auth.userID}
      `;

      console.log(`Balance updated: ${balance} -> ${newBalance}`);
    } else {
      console.log(`Transaction created with pending status, balance will be deducted after confirmation`);
    }

    const user = await db.queryRow<{ 
      phone_number: string; 
      full_name: string; 
    }>`
      SELECT phone_number, full_name
      FROM users
      WHERE clerk_user_id = ${auth.userID}
    `;

    if (!user) {
      throw APIError.notFound("User not found in database");
    }

    const phoneNumber = user.phone_number;
    const fullName = user.full_name || "Customer";

    console.log("=== CHECKING UNIPLAY CONFIG ===");
    let uniplayOrderId = "";
    let uniplaySN = "";
    
    const pkgConfig = await db.queryRow<{ 
      uniplay_entitas_id: string | null; 
      uniplay_denom_id: string | null; 
    }>`
      SELECT uniplay_entitas_id, uniplay_denom_id 
      FROM packages 
      WHERE id = ${packageId}
    `;
    
    const hasUniPlayConfig = pkgConfig?.uniplay_entitas_id && pkgConfig?.uniplay_denom_id;
    
    try {
      // NEW FLOW: Don't auto-confirm, will be confirmed from PurchaseInquiryPage
      if (inquiryId && hasUniPlayConfig) {
        console.log("✅ Transaction created with inquiry_id:", inquiryId);
        console.log("⏳ Payment will be confirmed via confirm-payment endpoint");
      } else if (hasUniPlayConfig) {
        // OLD FLOW: Legacy order creation for backward compatibility
        console.log("⚠️ No inquiry ID provided, using legacy order creation");
        const productRow = await db.queryRow<{ slug: string }>`
          SELECT slug FROM products WHERE id = ${productId}
        `;
        
        if (productRow) {
          const uniplayOrder = await createUniPlayOrder({
            product_code: productRow.slug.toUpperCase(),
            user_id: userId,
            zone_id: gameId,
            ref_id: transactionId,
          });
          
          if (uniplayOrder.status === "success") {
            uniplayOrderId = uniplayOrder.data.trx_id;
            console.log("✅ UniPlay order created:", uniplayOrderId);
            console.log("✅ Price:", uniplayOrder.data.price);
            console.log("✅ Status:", uniplayOrder.data.status);
            
            await db.exec`
              UPDATE transactions
              SET uniplay_order_id = ${uniplayOrderId}
              WHERE id = ${transactionId}
            `;
          } else {
            console.error("❌ UniPlay order failed:", uniplayOrder.message);
          }
        }
      } else {
        console.log("⚠️ Package not configured with UniPlay - skipping UniPlay order creation");
        console.log("Transaction will be marked as success but won't have UniPlay order ID");
      }
    } catch (uniplayError) {
      console.error("❌ Failed to confirm UniPlay payment:", uniplayError);
      console.log("⚠️ Transaction will still be marked as success");
    }

    console.log("=== SENDING PURCHASE CONFIRMATIONS ===");
    console.log("Phone:", phoneNumber);

    // Only send WhatsApp for successful transactions (old flow)
    // For new flow (pending), WhatsApp will be sent after confirm payment
    if (status === 'success' && phoneNumber) {
      try {
        console.log("📱 Attempting to send WhatsApp confirmation to:", phoneNumber);
        
        const formatCurrency = (amount: number) => {
          return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          }).format(amount);
        };
        
        const configRow = await db.queryRow<{ value: string }>`
          SELECT value FROM admin_config WHERE key = 'dashboard_config'
        `;

        let fonnteToken = "";
        if (configRow) {
          const config = JSON.parse(configRow.value);
          fonnteToken = config.whatsapp?.fonnteToken || "";
        }

        if (!fonnteToken || fonnteToken === "") {
          console.warn("⚠️ Fonnte Token not configured - WhatsApp notification skipped");
        } else {
          console.log("📱 Fonnte Token found, preparing to send...");
          
          let formattedPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "").replace(/-/g, "");
          
          if (formattedPhone.startsWith("0")) {
            formattedPhone = "62" + formattedPhone.substring(1);
          } else if (!formattedPhone.startsWith("62")) {
            formattedPhone = "62" + formattedPhone;
          }
          
          console.log("📱 Formatted phone number:", formattedPhone);
          
          const usernameInfo = username ? `Username: ${username}\n` : '';
          const message = `✅ *PEMBELIAN BERHASIL - TopAsli*\n\nHalo ${fullName},\n\nPembelian Anda telah berhasil diproses!\n\n📦 *Detail Pembelian*\nProduk: ${product.name}\nPaket: ${pkg.name}\nHarga: ${formatCurrency(pkg.price)}\n\n🎮 *Akun Game*\n${usernameInfo}User ID: ${userId}\nGame ID: ${gameId}\n\n💰 *Pembayaran*\nTotal: ${formatCurrency(price)}\nSisa Saldo: ${formatCurrency(newBalance)}\n\n🆔 *ID Transaksi*\n${transactionId}\n\n⚠️ Item akan segera diproses dan dikirim ke akun game Anda dalam waktu maksimal 5 menit.\n\nKami dengan senang hati melayani kebutuhan top-up Anda. 🙏`;

          const formData = new URLSearchParams();
          formData.append('target', formattedPhone);
          formData.append('message', message);
          formData.append('countryCode', '62');

          console.log("📱 Sending to Fonnte API...");

          const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              'Authorization': fonnteToken,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          });

          const data = await response.json();
          console.log("📱 Fonnte API Response:", JSON.stringify(data, null, 2));

          const responseData = data as any;
          if (!response.ok || responseData.status === false) {
            console.error("❌ Fonnte error:", responseData.reason || "Unknown error");
          } else {
            console.log("✅ WhatsApp confirmation sent successfully!");
            console.log("📱 Message ID:", responseData.id);
            console.log("📱 Target:", responseData.target);
          }
        }
      } catch (whatsappError: any) {
        console.error("❌ Failed to send WhatsApp:", whatsappError);
        console.error("❌ Error details:", whatsappError.message);
      }
    } else if (status === 'pending') {
      console.log("⏳ Transaction pending - WhatsApp will be sent after confirmation");
    }

    console.log("=== TRANSACTION COMPLETED SUCCESSFULLY ===");

    await transactionTopic.publish({
      transactionId,
      userId: auth.userID,
      productName: `${product.name} - ${pkg.name}`,
      amount: total,
      status: "success",
      timestamp: new Date(),
    });

    return {
      id: transactionId,
      transactionId: transactionId,
      total,
      status,
    };
  }
);
