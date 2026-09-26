import { betterAuth } from "better-auth";
import { Pool } from "pg";

// Origins allowed to call the auth API. On Vercel, preview and production
// URLs come from system env vars, so BETTER_AUTH_URL is optional there.
const vercel = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const auth = betterAuth({
  baseURL,
  trustedOrigins: vercel,
  // Neon Postgres (pooled connection string with sslmode=require).
  database: new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true, // signed in right after sign-up
  },
  user: {
    additionalFields: {
      // Self-declared at sign-up, so it is a preference, NOT a permission.
      // Never grant employee-only access based on this field alone.
      role: { type: ["citizen", "employee"], required: false, defaultValue: "citizen", input: true },
      lang: { type: ["ro", "ru"], required: false, defaultValue: "ro", input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days with "keep me signed in"
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database", // shared across serverless instances on Vercel
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
});
