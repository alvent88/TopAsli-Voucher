import { api, Header } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { APIError } from "encore.dev/api";
import { Bucket } from "encore.dev/storage/objects";

const productIcons = new Bucket("product-icons", {
  public: true,
});

export interface UploadIconRequest {
  fileName: string;
  contentType: string;
}

export interface UploadIconResponse {
  uploadUrl: string;
  publicUrl: string;
  fileName: string;
}

export const getUploadUrl = api<UploadIconRequest, UploadIconResponse>(
  { expose: true, method: "POST", path: "/admin/upload-icon-url", auth: true },
  async ({ fileName, contentType }) => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can upload icons");
    }

    const timestamp = Date.now();
    const ext = fileName.split('.').pop();
    const uniqueFileName = `product-${timestamp}.${ext}`;

    const { url } = await productIcons.signedUploadUrl(uniqueFileName, {
      ttl: 3600,
    });

    const publicUrl = productIcons.publicUrl(uniqueFileName);

    return {
      uploadUrl: url,
      publicUrl: publicUrl,
      fileName: uniqueFileName,
    };
  }
);
