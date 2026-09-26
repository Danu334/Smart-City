// A question asked before signing in. It waits in this tab (sessionStorage),
// never on the server, and the chat sends it once the visitor is signed in.

const KEY = "sc-pending-question";

export function savePendingQuestion(question: string) {
  try {
    sessionStorage.setItem(KEY, question);
  } catch {}
}

/** Reads and forgets the waiting question, so it is sent only once. */
export function takePendingQuestion(): string | null {
  try {
    const question = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return question?.trim() || null;
  } catch {
    return null;
  }
}

/** Where to go after signing in or up: back to the chat if a question waits. */
export function afterAuthPath(): string {
  try {
    if (sessionStorage.getItem(KEY)) return "/chat";
  } catch {}
  return "/";
}
