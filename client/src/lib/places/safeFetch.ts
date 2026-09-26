import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Fetching a page from a URL the user typed is the classic SSRF hole: it
// could point our server at localhost or a cloud metadata address. Only
// public http(s) hosts are allowed, every redirect is re-checked, and the
// response is capped in time and size.

const MAX_BYTES = 512 * 1024;
const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 3;

export class UnsafeUrlError extends Error {}

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast / reserved
  );
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80")) return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIPv4(mapped[1]) : false;
}

/** Cheap syntactic check: a real domain name, not an IP or local name. */
export function isPublicHostname(host: string): boolean {
  return !isIP(host) && host.includes(".") && !/^localhost$|\.(local|internal|localhost)$/i.test(host);
}

async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new UnsafeUrlError("protocol");
  if (url.username || url.password) throw new UnsafeUrlError("credentials");
  const host = url.hostname;
  if (!isPublicHostname(host)) throw new UnsafeUrlError("host");
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new UnsafeUrlError("private address");
  }
}

/** HTML of a public web page, or null if it is not HTML. Throws on unsafe URLs. */
export async function fetchPublicHtml(input: URL, userAgent: string): Promise<string | null> {
  let url = input;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": userAgent, accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) return null;
      url = new URL(next, url);
      continue;
    }
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html") || !res.body) return null;

    // Read at most MAX_BYTES; contact details are near the top or in the footer.
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
  }
  return null;
}
