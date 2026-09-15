import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: databaseUrl, ssl: databaseUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined });
try {
  // Remove constraints from the superseded lowercase model before schema.sql
  // normalizes existing rows. Fresh databases simply ignore these statements.
  await pool.query(`
    ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE IF EXISTS members DROP CONSTRAINT IF EXISTS members_role_check;
    ALTER TABLE IF EXISTS invitations DROP CONSTRAINT IF EXISTS invitations_role_check;
  `);
  const sql = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
  await pool.query("BEGIN");
  await pool.query(sql);
  await pool.query("COMMIT");
  console.log("schema applied; RBAC migration maps editor -> MEMBER and lowercase roles -> uppercase");
} catch (error) {
  await pool.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally { await pool.end(); }
