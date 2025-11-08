import { api } from "encore.dev/api";
import { APIError } from "encore.dev/api";
import db from "../db";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

export interface RegisterPhoneRequest {
  phoneNumber: string;
  fullName: string;
  birthDate?: string;
}

export interface RegisterPhoneResponse {
  success: boolean;
  message: string;
  userId?: string;
}

export const registerPhone = api<RegisterPhoneRequest, RegisterPhoneResponse>(
  { expose: true, method: "POST", path: "/auth/register-phone" },
  async ({ phoneNumber, fullName, birthDate }) => {
    console.log("=== REGISTER PHONE START ===");
    console.log("Input data:", {
      phoneNumber,
      fullName,
      birthDate,
    });
    
    try {
      let formattedPhone = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
      
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith("62")) {
        formattedPhone = "62" + formattedPhone;
      }

      console.log("Formatted phone:", formattedPhone);

      const existingRow = await db.queryRow<{ phone_number: string; clerk_user_id: string | null }>`
        SELECT phone_number, clerk_user_id FROM phone_registrations WHERE phone_number = ${formattedPhone}
      `;

      console.log("Existing row found:", !!existingRow);

      if (existingRow) {
        console.log("Updating existing registration");
        await db.exec`
          UPDATE phone_registrations
          SET full_name = ${fullName},
              birth_date = ${birthDate || ''},
              created_at = ${Math.floor(Date.now() / 1000)}
          WHERE phone_number = ${formattedPhone}
        `;
        console.log("Update completed");
        
        if (existingRow.clerk_user_id) {
          return {
            success: true,
            message: "Data berhasil diperbarui. Silakan login dengan nomor HP Anda.",
            userId: existingRow.clerk_user_id,
          };
        }
      } else {
        console.log("Creating new registration in database");
        await db.exec`
          INSERT INTO phone_registrations (phone_number, full_name, birth_place, birth_date, created_at)
          VALUES (${formattedPhone}, ${fullName}, '', ${birthDate || ''}, ${Math.floor(Date.now() / 1000)})
        `;
        console.log("Insert completed");
      }

      console.log("Creating Clerk user immediately");
      
      const randomEmail = `phone${formattedPhone}@temp.topassli.com`;
      
      let clerkUserId: string | undefined;
      
      try {
        const existingUsers = await clerkClient.users.getUserList({
          emailAddress: [randomEmail],
        });

        if (existingUsers.data.length > 0) {
          console.log("Clerk user already exists:", existingUsers.data[0].id);
          clerkUserId = existingUsers.data[0].id;
          
          await clerkClient.users.updateUser(clerkUserId, {
            unsafeMetadata: {
              fullName,
              birthDate: birthDate || '',
              profileComplete: true,
            },
          });
          console.log("Updated existing Clerk user");
        } else {
          console.log("Creating new Clerk user with email:", randomEmail);
          const newUser = await clerkClient.users.createUser({
            emailAddress: [randomEmail],
            skipPasswordRequirement: true,
            skipPasswordChecks: true,
            unsafeMetadata: {
              fullName,
              birthDate: birthDate || '',
              profileComplete: true,
            },
            publicMetadata: {
              registeredVia: "phone",
              phoneNumber: `+${formattedPhone}`,
            },
          });
          clerkUserId = newUser.id;
          console.log("Clerk user created:", clerkUserId);
        }
        
        if (clerkUserId) {
          await db.exec`
            UPDATE phone_registrations
            SET clerk_user_id = ${clerkUserId}
            WHERE phone_number = ${formattedPhone}
          `;
          console.log("Updated registration with Clerk user ID");
        }
        
      } catch (clerkError: any) {
        console.error("Error with Clerk user creation:");
        console.error("Error name:", clerkError.name);
        console.error("Error message:", clerkError.message);
        console.error("Error status:", clerkError.status);
        console.error("Error details:", JSON.stringify(clerkError, null, 2));
        console.log("User data saved to database, will create Clerk account on first login");
      }

      console.log("=== REGISTER PHONE SUCCESS ===");

      return {
        success: true,
        message: "Registrasi berhasil! Silakan login dengan nomor HP Anda.",
        userId: clerkUserId,
      };
    } catch (err: any) {
      console.error("=== REGISTER PHONE ERROR ===");
      console.error("Error:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      if (err instanceof APIError) {
        throw err;
      }
      
      throw APIError.internal(err.message || "Gagal menyimpan data registrasi");
    }
  }
);
