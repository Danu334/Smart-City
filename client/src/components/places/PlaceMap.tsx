import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_CENTER } from "@/lib/places/center";
import type { Place } from "@/types/places";
import styles from "./Places.module.css";

type PlaceMapProps = {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
};

const pin = (n: number, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<span class="${styles.pin}" data-active="${active}"><span>${n}</span></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -28],
  });

// OpenStreetMap tiles through Leaflet. Loaded only in the browser
// (see PlacesPanel's dynamic import).
export default function PlaceMap({ places, selectedId, onSelect, className }: PlaceMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const select = useRef(onSelect);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { scrollWheelZoom: false }).setView([CITY_CENTER.lat, CITY_CENTER.lon], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    L.circleMarker([CITY_CENTER.lat, CITY_CENTER.lon], {
      radius: 5,
      color: "#16202e",
      weight: 2,
      fillColor: "#ffd200",
      fillOpacity: 1,
    }).addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Draw the places and frame them.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();
    places.forEach((p, i) => {
      const marker = L.marker([p.lat, p.lon], { icon: pin(i + 1, false), title: p.name, keyboard: true })
        .bindPopup(`<strong>${escapeHtml(p.name)}</strong>`)
        .on("click", () => select.current(p.id))
        .addTo(m);
      markers.current.set(p.id, marker);
    });
    if (places.length === 1) m.setView([places[0].lat, places[0].lon], 16);
    else if (places.length > 1) m.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lon])), { padding: [36, 36], maxZoom: 16 });
  }, [places]);

  // Highlight and fly to the selected place.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    places.forEach((p, i) => markers.current.get(p.id)?.setIcon(pin(i + 1, p.id === selectedId)));
    const marker = selectedId ? markers.current.get(selectedId) : undefined;
    if (marker) {
      m.flyTo(marker.getLatLng(), Math.max(m.getZoom(), 16), { duration: 0.6 });
      marker.openPopup();
    }
  }, [selectedId, places]);

  return <div ref={box} className={`${styles.map} ${className ?? ""}`} />;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
