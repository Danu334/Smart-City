import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Same-origin client: talks to /api/auth/* on whatever host serves the page.
// inferAdditionalFields reads role / lang / privacyConsent from the server
// config, so the sign-up call is type-checked against it.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
export const { useSession, signIn, signUp, signOut } = authClient;
