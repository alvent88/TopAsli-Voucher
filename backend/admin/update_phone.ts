import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface UpdateSuperadminPhoneRequest {
  email: string;
  phoneNumber: string;
}

export interface UpdateSuperadminPhoneResponse {
  success: boolean;
  message: string;
}

export const updateSuperadminPhone = api<UpdateSuperadminPhoneRequest, UpdateSuperadminPhoneResponse>(
  { expose: true, method: "POST", path: "/admin/superadmin/update-phone", auth: true },
  async ({ email, phoneNumber }) => {
    const auth = getAuthData()!;
    
    if (!auth.isSuperAdmin) {
      throw APIError.permissionDenied("Only superadmin can update phone numbers");
    }

    try {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });

      if (users.data.length === 0) {
        throw APIError.notFound(`User with email ${email} not found`);
      }

      const user = users.data[0];
      
      console.log("Updating phone for user:", user.id);
      console.log("Current phone numbers:", user.phoneNumbers);
      console.log("New phone number:", phoneNumber);

      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+62" + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith("62")) {
        formattedPhone = "+" + formattedPhone;
      } else if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+62" + formattedPhone;
      }

      console.log("Formatted phone:", formattedPhone);

      if (user.phoneNumbers.length > 0) {
        console.log("Updating existing phone number");
        await clerkClient.phoneNumbers.updatePhoneNumber(
          user.phoneNumbers[0].id,
          {
            verified: true,
          }
        );
        
        await clerkClient.users.updateUser(user.id, {
          primaryPhoneNumberID: user.phoneNumbers[0].id,
        });
      } else {
        console.log("Creating new phone number");
        const phoneNumber = await clerkClient.phoneNumbers.createPhoneNumber({
          userId: user.id,
          phoneNumber: formattedPhone,
          verified: true,
          primary: true,
        });
        
        console.log("Phone number created:", phoneNumber);
      }

      console.log("Phone number updated successfully");

      return {
        success: true,
        message: `Phone number updated for ${email}`,
      };
    } catch (err: any) {
      console.error("Update phone error:", err);
      throw APIError.internal(err.message || "Failed to update phone number", err);
    }
  }
);
