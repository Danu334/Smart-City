import type { Conversation } from "@/types/chat";

// Visitors chat without an account and nothing is stored on the server. When
// they go to sign in or sign up from the chat, their conversations wait here
// (this tab's sessionStorage) and are saved to the account right after.

const KEY = "sc-guest-chats";

export function saveGuestChats(conversations: Conversation[]) {
  const withMessages = conversations.filter((c) => c.messages.length);
  if (!withMessages.length) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(withMessages));
  } catch {}
}

/** Reads and forgets the waiting conversations, so they are saved only once. */
export function takeGuestChats(): Conversation[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Conversation[]) : [];
  } catch {
    return [];
  }
}

/** Where to go after signing in or up: back to the chat if one waits to be saved. */
export function afterAuthPath(): string {
  try {
    if (sessionStorage.getItem(KEY)) return "/chat";
  } catch {}
  return "/";
}
