import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";
import { logAuditAction } from "../audit/logger";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface EditUserRequest {
  userId: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  balance?: number;
  birthDate?: string;
}

export interface EditUserResponse {
  success: boolean;
  message: string;
}

export const editUser = api<EditUserRequest, EditUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/edit", auth: true },
  async ({ userId, fullName, email, phoneNumber, balance, birthDate }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can edit users");
    }

    console.log("=== EDIT USER START ===");
    console.log("User ID:", userId);
    console.log("Full name:", fullName);
    console.log("Email:", email);
    console.log("Phone number:", phoneNumber);
    console.log("Balance:", balance);
    console.log("Birth date:", birthDate);

    try {
      const user = await clerkClient.users.getUser(userId);
      
      const userEmail = user.emailAddresses[0]?.emailAddress || null;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const currentFullName = [firstName, lastName].filter(Boolean).join(" ");
      const currentPhone = user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber || "";
      
      console.log("User email from Clerk:", userEmail);
      console.log("User full name from Clerk:", currentFullName);
      console.log("User phone from Clerk:", currentPhone);
      
      const existingUserRow = await db.queryRow<{ clerk_user_id: string, email: string | null }>`
        SELECT clerk_user_id, email FROM users WHERE clerk_user_id = ${userId}
      `;
      
      if (!existingUserRow) {
        console.log("User not found in users table, creating record...");
        const emailToUse = userEmail || (email !== undefined ? email : null);
        console.log("Email to use for new user:", emailToUse);
        
        await db.exec`
          INSERT INTO users (clerk_user_id, email, full_name, phone_number, birth_date, created_at, updated_at)
          VALUES (${userId}, ${emailToUse}, ${currentFullName}, ${currentPhone}, '2000-01-01', NOW(), NOW())
        `;
        console.log("User created in users table");
      } else if (!existingUserRow.email && email !== undefined) {
        console.log("User exists but has no email, will update with:", email);
        await db.exec`
          UPDATE users 
          SET email = ${email}, updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
      }
      
      const oldFullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      
      const oldValues: any = {
        fullName: oldFullName,
        email: userEmail || null,
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber,
      };
      
      try {
        const userRow = await db.queryRow<{ birth_date: Date }>`
          SELECT birth_date FROM users WHERE clerk_user_id = ${userId}
        `;
        if (userRow) {
          oldValues.birthDate = userRow.birth_date ? userRow.birth_date.toISOString().split('T')[0] : null;
        }
      } catch (err) {
        console.log("No birth_date found in users table");
      }
      
      const balanceResult = await db.queryRow<{ balance: number }>` 
        SELECT balance FROM user_balance WHERE user_id = ${userId}
      `;
      if (balanceResult) {
        oldValues.balance = balanceResult.balance;
      }
      
      if (fullName !== undefined) {
        console.log("Updating full name to:", fullName);
        
        await db.exec`
          UPDATE users 
          SET full_name = ${fullName}, updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
        console.log("Full name updated in users table");
      }

      if (phoneNumber !== undefined) {
        let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "62" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("62") && !formattedPhone.startsWith("+")) {
          formattedPhone = "62" + formattedPhone;
        }

        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+" + formattedPhone;
        }

        console.log("Updating phone number to:", formattedPhone);
        
        await db.exec`
          UPDATE users 
          SET phone_number = ${formattedPhone}, updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
        console.log("Phone number updated in users table");
      }

      if (email !== undefined && email !== userEmail) {
        console.log("Updating email from", userEmail, "to", email);
        
        if (userEmail) {
          await db.exec`
            UPDATE email_registrations 
            SET email = ${email}
            WHERE email = ${userEmail}
          `;
        }
        
        await db.exec`
          UPDATE users 
          SET email = ${email}, updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
        console.log("Email updated in users table");
      }

      if (balance !== undefined) {
        await db.exec`
          INSERT INTO user_balance (user_id, balance)
          VALUES (${userId}, ${balance})
          ON CONFLICT (user_id) 
          DO UPDATE SET balance = ${balance}
        `;
      }

      if (birthDate !== undefined) {
        console.log("Updating birth date to:", birthDate);
        try {
          await db.exec`
            UPDATE users 
            SET birth_date = ${birthDate}, updated_at = NOW()
            WHERE clerk_user_id = ${userId}
          `;
          console.log("Birth date updated successfully");
        } catch (birthDateError: any) {
          console.error("Failed to update birth date:", birthDateError);
          throw APIError.internal(`Failed to update birth date: ${birthDateError.message}`);
        }
      }

      console.log("User updated successfully");
      
      console.log("Logging audit action...");
      try {
        await logAuditAction({
          actionType: "UPDATE",
          entityType: "USER",
          entityId: userId,
          oldValues,
          newValues: { fullName, email, phoneNumber, balance, birthDate },
          metadata: {
            fieldsUpdated: Object.keys({ fullName, email, phoneNumber, balance, birthDate }).filter(
              (key) => (({ fullName, email, phoneNumber, balance, birthDate } as any)[key]) !== undefined
            ),
          },
        }, ipAddress, userAgent);
        console.log("Audit action logged successfully");
      } catch (auditError: any) {
        console.error("Failed to log audit action:", auditError);
      }

      return {
        success: true,
        message: "Data pengguna berhasil diperbarui",
      };
    } catch (err: any) {
      console.error("=== EDIT USER ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal memperbarui data pengguna");
    }
  }
);
