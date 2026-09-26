import { Pool } from "pg";

// One pool per server process, shared by Better Auth and the chat. Kept on
// globalThis so dev hot reloads don't open a new pool on every edit.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

// Neon pooled connection string with sslmode=require.
export const pool = globalForDb.pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;
