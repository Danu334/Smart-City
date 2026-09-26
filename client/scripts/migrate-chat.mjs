// Creates the chat tables on the database in DATABASE_URL: npm run db:chat
import { readFile } from "node:fs/promises";
import pg from "pg";

const sql = await readFile(new URL("../db/chat.sql", import.meta.url), "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(sql);
  console.log("chat tables ready");
} finally {
  await client.end();
}
