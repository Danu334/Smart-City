import type { Place, PlaceCategory, PlaceQueryKind, PlacesResult } from "@/types/places";
import { CITY_CENTER } from "./center";
import { fetchPublicHtml, isPublicHostname, UnsafeUrlError } from "./safeFetch";

// Turns a name ("Guvernul"), a website ("https://gov.md") or a category
// ("birou notarial") into places in Chișinău, using OpenStreetMap:
//   - Overpass: category and website look-ups inside the city boundary
//   - Nominatim: free-text name search, bounded to the city
// Both are free public services with usage policies (identify yourself, go
// easy on them), hence the User-Agent and the result cache below.

const USER_AGENT = "SmartCityChisinau/1.0 (hackathon prototype; https://smart-city-eta-beryl.vercel.app)";
const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

const VIEWBOX = "28.70,47.10,28.98,46.93"; // lon/lat corners around the municipality
// Bounding box of the municipality (south, west, north, east). Much faster
// on Overpass than filtering by the administrative area.
const BBOX = "(46.93,28.70,47.10,28.98)";
const MAX_RESULTS = 20;

/** Generic requests ("un birou notarial") list every such place, nearest first. */
const CATEGORIES: { category: PlaceCategory; match: RegExp; overpass: string }[] = [
  {
    category: "notary",
    match: /notar|нотари|notary/i,
    overpass: `nwr["office"="notary"]${BBOX};nwr["office"]["name"~"notar",i]${BBOX};`,
  },
  {
    category: "translator",
    match: /tradu|перевод|translat/i,
    overpass:
      `nwr["office"="translator"]${BBOX};nwr["craft"="translator"]${BBOX};` +
      `nwr["office"]["name"~"traduc|перевод|translat",i]${BBOX};nwr["shop"]["name"~"traduc|перевод|translat",i]${BBOX};`,
  },
];

type Tags = Record<string, string>;
type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Tags;
};
type NominatimResult = {
  osm_type: "node" | "way" | "relation";
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  category: string;
  type: string;
  display_name: string;
  address?: Record<string, string>;
  extratags?: Tags | null;
};

// ---------- small helpers ----------

function distanceKm(lat: number, lon: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat - CITY_CENTER.lat) * rad;
  const dLon = (lon - CITY_CENTER.lon) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(CITY_CENTER.lat * rad) * Math.cos(lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

function categoryOf(tags: Tags, name: string): PlaceCategory {
  if (tags.office === "notary" || /notar/i.test(name)) return "notary";
  if (tags.office === "translator" || tags.craft === "translator" || /traduc|перевод|translat/i.test(name)) return "translator";
  if (tags.office === "government" || tags.government || tags.amenity === "townhall" || tags.building === "government") {
    return "government";
  }
  if (tags.healthcare || ["hospital", "clinic", "doctors"].includes(tags.amenity ?? "")) return "health";
  return "other";
}

/** Only real web links: OSM is editable by anyone, so never trust a raw value. */
function webUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const splitList = (value?: string) =>
  (value ?? "")
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);

function toPlace(
  type: string,
  id: number,
  lat: number,
  lon: number,
  tags: Tags,
  fallbackName: string,
  fallbackAddress?: string,
): Place {
  const name = tags.name || tags["name:ro"] || fallbackName;
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  return {
    id: `${type}/${id}`,
    name,
    category: categoryOf(tags, name),
    lat,
    lon,
    address: street || fallbackAddress || undefined,
    phones: [...splitList(tags.phone), ...splitList(tags["contact:phone"]), ...splitList(tags["contact:mobile"])],
    website: webUrl(tags.website || tags["contact:website"] || tags.url),
    email: tags.email || tags["contact:email"] || undefined,
    openingHours: tags.opening_hours || undefined,
    distanceKm: distanceKm(lat, lon),
    osmUrl: `https://www.openstreetmap.org/${type}/${id}`,
    directionsUrl: `https://www.openstreetmap.org/directions?route=%3B${lat}%2C${lon}`,
  };
}

function fromOverpass(el: OverpassElement): Place | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const tags = el.tags ?? {};
  if (lat == null || lon == null || !(tags.name || tags["name:ro"])) return null;
  return toPlace(el.type, el.id, lat, lon, tags, "");
}

function fromNominatim(r: NominatimResult): Place {
  const a = r.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(" ");
  const tags = { [r.category]: r.type, ...(r.extratags ?? {}) };
  return toPlace(r.osm_type, r.osm_id, Number(r.lat), Number(r.lon), tags, r.name || r.display_name.split(",")[0], street);
}

/** Drop duplicates (same OSM object, or same name at the same spot). */
function unique(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    const key = `${p.name.toLowerCase()}|${p.lat.toFixed(4)}|${p.lon.toFixed(4)}`;
    if (seen.has(p.id) || seen.has(key)) return false;
    seen.add(p.id);
    seen.add(key);
    return true;
  });
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * "Primaria" should match "Primăria", and "Rîșcani" should match "Râșcani"
 * (both spellings are in use): strip diacritics, then allow every variant.
 */
function looseRegex(word: string): string {
  const classes: Record<string, string> = { a: "[aăâ]", i: "[iîâ]", s: "[sșş]", t: "[tțţ]" };
  const plain = word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return [...plain].map((ch) => classes[ch] ?? escapeRegex(ch)).join("");
}

// ---------- remote look-ups ----------

async function overpass(body: string): Promise<OverpassElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "user-agent": USER_AGENT, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: `[out:json][timeout:25];(${body});out center tags ${MAX_RESULTS * 3};` }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

async function nominatim(q: string): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    extratags: "1",
    countrycodes: "md",
    viewbox: VIEWBOX,
    bounded: "1",
    limit: "8",
    "accept-language": "ro",
  });
  const res = await fetch(`${NOMINATIM}?${params}`, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return (await res.json()) as NominatimResult[];
}

// Streets, bus stops, districts... are not "a facility".
const NOT_A_FACILITY = new Set(["highway", "place", "boundary", "landuse", "railway", "waterway", "natural", "route"]);

async function byName(name: string): Promise<Place[]> {
  // Significant words of the query; results are ranked by how many they contain.
  const words = name
    .split(/[\s,.;:()"'„”«»-]+/)
    .filter((w) => w.length >= 3 && !/^(din|de|la|al|ale|lui|the|and|pentru)$/i.test(w));
  const score = (p: Place) => words.filter((w) => new RegExp(looseRegex(w), "i").test(p.name)).length;
  const ranked = (places: Place[]) => places.sort((a, b) => score(b) - score(a) || a.distanceKm - b.distanceKm);

  const exact = (await nominatim(name)).filter((r) => !NOT_A_FACILITY.has(r.category)).map(fromNominatim);
  if (exact.length) return ranked(exact);
  if (!words.length) return [];

  // Fallback: tolerant match on the longest word, among facility-like objects.
  const longest = [...words].sort((a, b) => b.length - a.length)[0];
  const re = looseRegex(longest);
  const facility = ["office", "amenity", "government", "building", "healthcare", "shop"]
    .map((key) => `nwr["${key}"]["name"~"${re}",i]${BBOX};`)
    .join("");
  const found = (await overpass(facility)).map(fromOverpass).filter((p): p is Place => p !== null);
  return ranked(found);
}

/** What a site says about itself: name, phones, and schema.org details. */
function readPage(html: string) {
  const meta = (prop: string) =>
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)`, "i"))?.[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const name = (meta("og:site_name") || title || "").replace(/\s+/g, " ").split(/\s[|–—-]\s/)[0].trim();
  const phones = [...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map((m) => decodeURIComponent(m[1]).trim());
  let address: string | undefined;
  let geo: { lat: number; lon: number } | undefined;
  for (const block of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(block[1]);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item?.telephone) phones.push(String(item.telephone));
        const a = item?.address;
        if (!address && a) address = typeof a === "string" ? a : [a.streetAddress, a.addressLocality].filter(Boolean).join(", ");
        const g = item?.geo;
        if (!geo && g?.latitude && g?.longitude) geo = { lat: Number(g.latitude), lon: Number(g.longitude) };
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return { name, phones: [...new Set(phones)].slice(0, 3), address, geo };
}

async function byWebsite(raw: string): Promise<Place[]> {
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  // IPs and local names are never a facility's website: stop before any look-up.
  if (!isPublicHostname(url.hostname)) return [];
  const host = url.hostname.replace(/^www\./i, "");

  // 1. Something in OpenStreetMap already links to this site.
  const hostRe = `://(www\\\\.)?${escapeRegex(host).replace(/\\/g, "\\\\")}(/|$)`;
  const tagged = (
    await overpass(
      `nwr["website"~"${hostRe}",i]${BBOX};nwr["contact:website"~"${hostRe}",i]${BBOX};nwr["url"~"${hostRe}",i]${BBOX};`,
    )
  )
    .map(fromOverpass)
    .filter((p): p is Place => p !== null);
  if (tagged.length) return tagged;

  // 2. Read the site itself for its name and contact details.
  const html = await fetchPublicHtml(url, USER_AGENT);
  if (!html) return [];
  const page = readPage(html);
  const enrich = (p: Place): Place => ({
    ...p,
    website: p.website ?? url.origin,
    phones: p.phones.length ? p.phones : page.phones,
  });
  if (page.geo) {
    return [
      enrich(
        toPlace("site", 0, page.geo.lat, page.geo.lon, {}, page.name || host, page.address),
      ),
    ].map((p) => ({ ...p, id: `site/${host}`, osmUrl: `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}` }));
  }
  const byPageName = page.name ? await byName(page.name) : [];
  const byAddress = !byPageName.length && page.address ? await byName(page.address) : [];
  return [...byPageName, ...byAddress].map(enrich);
}

// ---------- entry point ----------

export function classify(input: string): PlaceQueryKind {
  const q = input.trim();
  if (/^https?:\/\//i.test(q) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q)) return "url";
  // Short generic phrases name a category; longer ones are a specific office
  // ("Biroul Notarului Public Veronica Roșca").
  if (q.split(/\s+/).length <= 3 && CATEGORIES.some((c) => c.match.test(q))) return "category";
  return "name";
}

const cache = new Map<string, { at: number; value: PlacesResult }>();
const CACHE_MS = 12 * 60 * 60 * 1000;

/** Main function: name, website or category in; places in Chișinău out. */
export async function resolvePlaces(input: string): Promise<PlacesResult> {
  const query = input.trim().slice(0, 200);
  const key = query.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const kind = classify(query);
  let places: Place[] = [];
  if (kind === "category") {
    const cat = CATEGORIES.find((c) => c.match.test(query))!;
    places = (await overpass(cat.overpass)).map(fromOverpass).filter((p): p is Place => p !== null);
    places.sort((a, b) => a.distanceKm - b.distanceKm);
  } else if (kind === "url") {
    try {
      places = await byWebsite(query);
    } catch (e) {
      if (!(e instanceof UnsafeUrlError) && !(e instanceof TypeError)) throw e;
      places = []; // not a usable public URL
    }
  } else {
    places = await byName(query);
  }

  const value: PlacesResult = { query, kind, places: unique(places).slice(0, MAX_RESULTS) };
  if (cache.size > 300) cache.clear();
  cache.set(key, { at: Date.now(), value });
  return value;
}
