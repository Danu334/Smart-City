// A place found from a name, a website or a category ("birou notarial").
// Data comes from OpenStreetMap, so any field except name/coordinates may be missing.

export type PlaceCategory = "notary" | "translator" | "government" | "health" | "other";

export type Place = {
  /** OpenStreetMap id, e.g. "node/123". */
  id: string;
  name: string;
  category: PlaceCategory;
  lat: number;
  lon: number;
  address?: string;
  phones: string[];
  website?: string;
  email?: string;
  /** Raw OSM opening_hours, e.g. "Mo-Fr 09:00-17:00". */
  openingHours?: string;
  /** Straight-line distance from the city centre. */
  distanceKm: number;
  osmUrl: string;
  directionsUrl: string;
};

/** How the input was understood. */
export type PlaceQueryKind = "category" | "url" | "name";

export type PlacesResult = {
  query: string;
  kind: PlaceQueryKind;
  places: Place[];
};
