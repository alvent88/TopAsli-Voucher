import { api } from "encore.dev/api";
import bcrypt from "bcryptjs";

export interface TestPasswordRequest {
  password: string;
  hash: string;
}

export const testPassword = api<TestPasswordRequest, { match: boolean }>(
  { expose: true, method: "POST", path: "/admin/test-password", auth: false },
  async ({ password, hash }) => {
    const match = await bcrypt.compare(password, hash);
    console.log("Password:", password);
    console.log("Hash:", hash);
    console.log("Match:", match);
    return { match };
  }
);
