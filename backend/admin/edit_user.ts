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
      
      const oldFullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      
      const oldValues: any = {
        fullName: oldFullName,
        email: user.emailAddresses[0]?.emailAddress,
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || user.phoneNumbers[0]?.phoneNumber,
      };
      
      const userEmail = user.emailAddresses[0]?.emailAddress;
      if (userEmail) {
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
      }
      
      const balanceResult = await db.queryRow<{ balance: number }>` 
        SELECT balance FROM user_balance WHERE user_id = ${userId}
      `;
      if (balanceResult) {
        oldValues.balance = balanceResult.balance;
      }
      
      const updates: any = {};

      if (fullName !== undefined) {
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        updates.firstName = firstName;
        updates.lastName = lastName;
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
        
        if (user.phoneNumbers.length > 0) {
          console.log("Deleting existing phone numbers");
          for (const phone of user.phoneNumbers) {
            await clerkClient.phoneNumbers.deletePhoneNumber(phone.id);
          }
        }
        
        const newPhoneNumber = await clerkClient.phoneNumbers.createPhoneNumber({
          userId: userId,
          phoneNumber: formattedPhone,
          verified: true,
          primary: true,
        });
        
        updates.primaryPhoneNumberId = newPhoneNumber.id;
      }

      if (email !== undefined && email !== user.emailAddresses[0]?.emailAddress) {
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [email],
        });

        if (existingUsers.data.length > 0 && existingUsers.data[0].id !== userId) {
          throw APIError.invalidArgument("Email sudah digunakan oleh user lain");
        }

        const oldEmail = user.emailAddresses[0]?.emailAddress;
        
        if (oldEmail) {
          await db.exec`
            UPDATE email_registrations 
            SET email = ${email}
            WHERE email = ${oldEmail}
          `;
        }

        await clerkClient.users.updateUser(userId, {
          primaryEmailAddressID: undefined,
        });

        const emailAddresses = user.emailAddresses;
        for (const emailAddr of emailAddresses) {
          await clerkClient.emailAddresses.deleteEmailAddress(emailAddr.id);
        }

        const newEmailAddress = await clerkClient.emailAddresses.createEmailAddress({
          userId: userId,
          emailAddress: email,
          verified: true,
        });

        updates.primaryEmailAddressId = newEmailAddress.id;
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
        await db.exec`
          UPDATE users 
          SET birth_date = ${birthDate}, updated_at = NOW()
          WHERE clerk_user_id = ${userId}
        `;
      }

      if (Object.keys(updates).length > 0) {
        await clerkClient.users.updateUser(userId, updates);
      }

      console.log("User updated successfully");
      
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
