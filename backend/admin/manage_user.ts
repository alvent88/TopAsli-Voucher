import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import { logAuditAction } from "../audit/logger";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface SetAdminRequest {
  email: string;
}

export interface SetAdminResponse {
  success: boolean;
  message: string;
}

export const setAdmin = api<SetAdminRequest, SetAdminResponse>(
  { expose: true, method: "POST", path: "/admin/set-admin" },
  async ({ email }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    console.log("=== SET ADMIN START ===");
    console.log("Email:", email);

    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        throw APIError.notFound(`User dengan email ${email} tidak ditemukan`);
      }

      const user = users.data[0];
      
      console.log("Found user:", user.id);

      await clerkClient.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          isAdmin: true,
        },
      });

      console.log("User promoted to admin successfully");
      
      await logAuditAction({
        actionType: "PROMOTE",
        entityType: "ADMIN",
        entityId: user.id,
        oldValues: { isAdmin: user.publicMetadata?.isAdmin || false },
        newValues: { isAdmin: true },
        metadata: { targetUserEmail: email },
      }, ipAddress, userAgent);

      return {
        success: true,
        message: `${email} berhasil diangkat menjadi admin`,
      };
    } catch (err: any) {
      console.error("=== SET ADMIN ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal mengangkat user menjadi admin");
    }
  }
);

export interface UpdatePhoneRequest {
  email: string;
  phoneNumber: string;
}

export interface UpdatePhoneResponse {
  success: boolean;
  message: string;
}

export const updateUserPhone = api<UpdatePhoneRequest, UpdatePhoneResponse>(
  { expose: true, method: "POST", path: "/admin/update-phone" },
  async ({ email, phoneNumber }, ipAddress?: Header<"x-forwarded-for">, userAgent?: Header<"user-agent">) => {
    console.log("=== UPDATE USER PHONE START ===");
    console.log("Email:", email);
    console.log("New phone:", phoneNumber);

    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        throw APIError.notFound(`User dengan email ${email} tidak ditemukan`);
      }

      const user = users.data[0];
      
      console.log("Found user:", user.id);

      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62") && !formattedPhone.startsWith("+")) {
        formattedPhone = "62" + formattedPhone;
      }

      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }

      console.log("Formatted phone:", formattedPhone);

      await clerkClient.users.updateUser(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          phoneNumber: formattedPhone,
        },
      });

      console.log("Phone number updated successfully");
      
      await logAuditAction({
        actionType: "UPDATE",
        entityType: "USER",
        entityId: user.id,
        oldValues: { phoneNumber: user.publicMetadata?.phoneNumber },
        newValues: { phoneNumber: formattedPhone },
        metadata: { targetUserEmail: email },
      }, ipAddress, userAgent);

      return {
        success: true,
        message: `Nomor HP ${email} berhasil diupdate ke ${phoneNumber}`,
      };
    } catch (err: any) {
      console.error("=== UPDATE PHONE ERROR ===");
      console.error("Error:", err);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal update nomor HP");
    }
  }
);
