// Client-side ids for messages and conversations until the server assigns real ones.

let seq = 0;
export function makeId(prefix = "m") {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}
