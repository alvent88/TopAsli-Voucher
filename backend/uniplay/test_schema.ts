import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface TestDatabaseSchemaResponse {
  productsColumns: string[];
  packagesColumns: string[];
  sampleProduct: any;
  samplePackage: any;
}

export const testDatabaseSchema = api<void, TestDatabaseSchemaResponse>(
  { expose: true, method: "GET", path: "/uniplay/test-schema", auth: true },
  async () => {
    const auth = getAuthData()!;
    
    if (!auth.isAdmin) {
      throw APIError.permissionDenied("Only admin can test schema");
    }

    console.log("=== TESTING DATABASE SCHEMA ===");

    // Get products columns
    const productsInfo = await db.rawQueryAll(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    const productsColumns = productsInfo.map((col: any) => `${col.column_name} (${col.data_type})`);
    console.log("Products columns:", productsColumns);

    // Get packages columns
    const packagesInfo = await db.rawQueryAll(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'packages'
      ORDER BY ordinal_position
    `);
    
    const packagesColumns = packagesInfo.map((col: any) => `${col.column_name} (${col.data_type})`);
    console.log("Packages columns:", packagesColumns);

    // Get sample product
    const sampleProduct = await db.queryRow<any>`
      SELECT * FROM products LIMIT 1
    `;

    // Get sample package
    const samplePackage = await db.queryRow<any>`
      SELECT * FROM packages LIMIT 1
    `;

    console.log("Sample product:", sampleProduct);
    console.log("Sample package:", samplePackage);

    return {
      productsColumns,
      packagesColumns,
      sampleProduct: sampleProduct || {},
      samplePackage: samplePackage || {},
    };
  }
);
