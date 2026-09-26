import { createAuthClient } from "better-auth/react";

// Same-origin client: talks to /api/auth/* on whatever host serves the page.
export const authClient = createAuthClient();
export const { useSession, signIn, signUp, signOut } = authClient;
