import { toNodeHandler } from "better-auth/node";
import { auth } from "@/lib/auth";

// Better Auth parses the body itself.
export const config = { api: { bodyParser: false } };

export default toNodeHandler(auth.handler);
