import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import db from "../db";
import { checkAndLogBruteForceVoucher } from "../otp/security_logger";

export interface GetBalanceResponse {
  balance: number;
}

export const getBalance = api<void, GetBalanceResponse>(
  { expose: true, method: "GET", path: "/balance", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    try {
      let row = await db.queryRow<{ balance: number }>`
        SELECT balance FROM user_balance WHERE user_id = ${auth.userID}
      `;

      if (!row) {
        await db.exec`
          INSERT INTO user_balance (user_id, balance)
          VALUES (${auth.userID}, 0)
        `;
        row = { balance: 0 };
      }

      return { balance: row.balance };
    } catch (err) {
      console.error("Get balance error:", err);
      throw APIError.internal("Failed to get balance", err as Error);
    }
  }
);



export interface RedeemVoucherRequest {
  code: string;
}

export interface RedeemVoucherResponse {
  success: boolean;
  amount: number;
  newBalance: number;
  message: string;
}

export const redeemVoucher = api<RedeemVoucherRequest, RedeemVoucherResponse>(
  { expose: true, method: "POST", path: "/balance/redeem", auth: true },
  async ({ code }) => {
    const auth = getAuthData()!;

    try {
      console.log("=== REDEEM VOUCHER START ===");
      console.log("User ID:", auth.userID);
      console.log("User phone:", auth.phoneNumber);
      console.log("Voucher code:", code);

      const userBanCheck = await db.queryRow<{
        is_banned: boolean;
        ban_reason: string | null;
        banned_until: Date | null;
      }>`
        SELECT is_banned, ban_reason, banned_until
        FROM users
        WHERE clerk_user_id = ${auth.userID}
      `;

      if (userBanCheck?.is_banned) {
        const now = new Date();
        if (userBanCheck.banned_until && userBanCheck.banned_until > now) {
          const remainingMinutes = Math.ceil((userBanCheck.banned_until.getTime() - now.getTime()) / 60000);
          throw APIError.permissionDenied(
            `Akun Anda telah dibanned. Alasan: ${userBanCheck.ban_reason || "Brute force voucher attempts"}. Silakan coba lagi dalam ${remainingMinutes} menit.`
          );
        } else if (userBanCheck.banned_until && userBanCheck.banned_until <= now) {
          await db.exec`
            UPDATE users
            SET is_banned = false,
                ban_reason = NULL,
                banned_at = NULL,
                banned_until = NULL,
                banned_by = NULL
            WHERE clerk_user_id = ${auth.userID}
          `;
          console.log("Auto-unban user after 1 hour:", auth.userID);
        } else {
          throw APIError.permissionDenied(
            `Akun Anda telah dibanned secara permanen. Alasan: ${userBanCheck.ban_reason || "Tidak ada alasan yang diberikan"}. Hubungi admin untuk unban.`
          );
        }
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentFailedAttempts = await db.queryAll<{ count: string }>`
        SELECT COUNT(*) as count 
        FROM voucher_claim_attempts 
        WHERE user_id = ${auth.userID}
        AND success = false 
        AND attempted_at > ${fiveMinutesAgo}
      `;

      const failedCount = parseInt(recentFailedAttempts[0]?.count || '0');
      
      if (failedCount >= 5) {
        await checkAndLogBruteForceVoucher(auth.userID, auth.phoneNumber || null, null);
        
        const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
        await db.exec`
          UPDATE users
          SET is_banned = true,
              ban_reason = 'Auto-ban: Brute force voucher redeem attempts (5+ failed in 5 minutes)',
              banned_at = NOW(),
              banned_until = ${oneHourLater},
              banned_by = 'SYSTEM'
          WHERE clerk_user_id = ${auth.userID}
        `;
        
        console.log("User auto-banned for 1 hour due to brute force voucher:", auth.userID);
        
        throw APIError.permissionDenied("Anda telah dibanned selama 1 jam karena terlalu banyak mencoba kode voucher yang salah. Hubungi admin jika ini adalah kesalahan.");
      }

      const voucherRow = await db.queryRow<{
        code: string;
        amount: number;
        is_active: boolean;
        claimed_by_user_id: string | null;
        claimed_by_phone: string | null;
      }>`
        SELECT code, amount, is_active, claimed_by_user_id, claimed_by_phone
        FROM vouchers
        WHERE code = ${code}
      `;

      if (!voucherRow) {
        await db.exec`
          INSERT INTO voucher_claim_attempts (user_id, attempted_code, success)
          VALUES (${auth.userID}, ${code}, false)
        `;
        await checkAndLogBruteForceVoucher(auth.userID, auth.phoneNumber || null, null);
        throw APIError.invalidArgument("Kode voucher tidak valid");
      }

      if (!voucherRow.is_active) {
        await db.exec`
          INSERT INTO voucher_claim_attempts (user_id, attempted_code, success)
          VALUES (${auth.userID}, ${code}, false)
        `;
        throw APIError.invalidArgument("Voucher sudah tidak aktif");
      }

      if (voucherRow.claimed_by_user_id) {
        await db.exec`
          INSERT INTO voucher_claim_attempts (user_id, attempted_code, success)
          VALUES (${auth.userID}, ${code}, false)
        `;
        
        if (voucherRow.claimed_by_user_id === auth.userID) {
          throw APIError.alreadyExists("Anda sudah menggunakan voucher ini");
        } else {
          throw APIError.invalidArgument("Voucher sudah digunakan oleh user lain");
        }
      }

      let balanceRow = await db.queryRow<{ balance: number }>`
        SELECT balance FROM user_balance WHERE user_id = ${auth.userID}
      `;

      if (!balanceRow) {
        await db.exec`
          INSERT INTO user_balance (user_id, balance)
          VALUES (${auth.userID}, 0)
        `;
        balanceRow = { balance: 0 };
      }

      const newBalance = balanceRow.balance + voucherRow.amount;

      await db.exec`
        UPDATE user_balance
        SET balance = ${newBalance}, updated_at = NOW()
        WHERE user_id = ${auth.userID}
      `;

      const description = `Redeem voucher: ${code}`;

      await db.exec`
        INSERT INTO balance_history (user_id, amount, type, description, voucher_code)
        VALUES (${auth.userID}, ${voucherRow.amount}, 'voucher', ${description}, ${code})
      `;

      await db.exec`
        UPDATE vouchers
        SET claimed_by_user_id = ${auth.userID},
            claimed_by_phone = ${auth.phoneNumber},
            claimed_at = NOW(),
            used_count = used_count + 1
        WHERE code = ${code}
      `;

      await db.exec`
        INSERT INTO voucher_claim_attempts (user_id, attempted_code, success)
        VALUES (${auth.userID}, ${code}, true)
      `;

      console.log("=== REDEEM VOUCHER SUCCESS ===");

      return {
        success: true,
        amount: voucherRow.amount,
        newBalance: newBalance,
        message: `Berhasil! Saldo Anda bertambah Rp ${voucherRow.amount.toLocaleString('id-ID')}`,
      };
    } catch (err: any) {
      console.error("=== REDEEM VOUCHER ERROR ===");
      console.error("Error:", err);
      console.error("Error message:", err.message);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal("Failed to redeem voucher: " + err.message, err);
    }
  }
);

export interface BalanceHistory {
  id: number;
  amount: number;
  type: string;
  description: string;
  voucherCode: string | null;
  createdAt: string;
}

export interface GetBalanceHistoryResponse {
  history: BalanceHistory[];
}

export const getBalanceHistory = api<void, GetBalanceHistoryResponse>(
  { expose: true, method: "GET", path: "/balance/history", auth: true },
  async () => {
    const auth = getAuthData()!;

    try {
      const rows = await db.rawQueryAll<any>(
        `SELECT id, amount, type, description, voucher_code, created_at
         FROM balance_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        auth.userID
      );

      const history: BalanceHistory[] = rows.map(row => ({
        id: row.id,
        amount: row.amount,
        type: row.type,
        description: row.description,
        voucherCode: row.voucher_code,
        createdAt: row.created_at,
      }));

      return { history };
    } catch (err) {
      console.error("Get balance history error:", err);
      throw APIError.internal("Failed to get balance history", err as Error);
    }
  }
);
