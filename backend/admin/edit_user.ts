import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface EditUserRequest {
  userId: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  balance?: number;
}

export interface EditUserResponse {
  success: boolean;
  message: string;
}

export const editUser = api<EditUserRequest, EditUserResponse>(
  { expose: true, method: "POST", path: "/admin/users/:userId/edit", auth: true },
  async ({ userId, fullName, email, phoneNumber, balance }) => {
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

    try {
      const user = await clerkClient.users.getUser(userId);
      
      const updates: any = {};

      if (fullName !== undefined) {
        updates.unsafeMetadata = {
          ...user.unsafeMetadata,
          fullName,
        };
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

        updates.publicMetadata = {
          ...user.publicMetadata,
          phoneNumber: formattedPhone,
        };
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

      if (Object.keys(updates).length > 0) {
        await clerkClient.users.updateUser(userId, updates);
      }

      console.log("User updated successfully");

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
