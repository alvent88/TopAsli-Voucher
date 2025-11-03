import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("db", {
  migrations: "./migrations",
});

export async function withTransaction<T>(
  db: SQLDatabase,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  const tx = await db.begin();
  try {
    const result = await callback(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
