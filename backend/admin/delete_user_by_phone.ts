import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import db from "../db";
import { logAuditAction } from "../audit/logger";
import { extractAuditHeaders } from "../audit/extract_headers";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface DeleteUserByPhoneRequest {
  phoneNumber: string;
}

export interface DeleteUserByPhoneResponse {
  success: boolean;
  message: string;
  deletedFromClerk: boolean;
  deletedFromDatabase: boolean;
}

export const deleteUserByPhone = api<DeleteUserByPhoneRequest, DeleteUserByPhoneResponse>(
  { expose: true, method: "POST", path: "/admin/delete-user-by-phone" },
  async (
    { phoneNumber },
    xForwardedFor?: Header<"x-forwarded-for">,
    xRealIp?: Header<"x-real-ip">,
    cfConnectingIp?: Header<"cf-connecting-ip">,
    trueClientIp?: Header<"true-client-ip">,
    userAgent?: Header<"user-agent">
  ) => {
    console.log("=== DELETE USER BY PHONE START ===");
    console.log("Phone number:", phoneNumber);

    try {
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }

      console.log("Formatted phone:", formattedPhone);

      let deletedFromClerk = false;
      let deletedFromDatabase = false;

      // Check database
      const registrationRow = await db.queryRow<{ 
        phone_number: string; 
        clerk_user_id: string | null;
      }>`
        SELECT phone_number, clerk_user_id FROM phone_registrations 
        WHERE phone_number = ${formattedPhone}
      `;

      if (registrationRow) {
        console.log("Found registration in database");
        
        // Delete from Clerk if has clerk_user_id
        if (registrationRow.clerk_user_id) {
          console.log("Deleting from Clerk:", registrationRow.clerk_user_id);
          try {
            await clerkClient.users.deleteUser(registrationRow.clerk_user_id);
            deletedFromClerk = true;
            console.log("Deleted from Clerk successfully");
          } catch (clerkError: any) {
            console.error("Failed to delete from Clerk:", clerkError);
          }
        }

        // Delete from database
        await db.exec`
          DELETE FROM phone_registrations WHERE phone_number = ${formattedPhone}
        `;
        deletedFromDatabase = true;
        console.log("Deleted from database successfully");
      }

      // Also check Clerk directly by phone number in publicMetadata
      const emailIdentifier = `phone${formattedPhone}@temp.topassli.com`;
      
      try {
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [emailIdentifier],
        });

        if (existingUsers.data.length > 0) {
          console.log("Found user in Clerk by email:", existingUsers.data[0].id);
          await clerkClient.users.deleteUser(existingUsers.data[0].id);
          deletedFromClerk = true;
          console.log("Deleted from Clerk successfully");
        }
      } catch (clerkError: any) {
        console.error("Failed to search/delete from Clerk:", clerkError);
      }

      console.log("=== DELETE USER BY PHONE SUCCESS ===");
      
      await logAuditAction({
        actionType: "DELETE",
        entityType: "USER",
        entityId: registrationRow?.clerk_user_id || formattedPhone,
        oldValues: { phoneNumber: formattedPhone },
        metadata: { deletedFromClerk, deletedFromDatabase },
      }, extractAuditHeaders(xForwardedFor, xRealIp, cfConnectingIp, trueClientIp, userAgent));

      return {
        success: true,
        message: `User dengan nomor ${phoneNumber} berhasil dihapus`,
        deletedFromClerk,
        deletedFromDatabase,
      };
    } catch (err: any) {
      console.error("=== DELETE USER BY PHONE ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal menghapus user");
    }
  }
);
