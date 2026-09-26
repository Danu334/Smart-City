import { useState } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import { usePlaces } from "@/lib/places/usePlaces";
import type { Place } from "@/types/places";
import styles from "./Places.module.css";

// Leaflet touches `window`, so the map only renders in the browser.
const PlaceMap = dynamic(() => import("./PlaceMap"), {
  ssr: false,
  loading: () => <div className={styles.map} data-placeholder />,
});

type PlacesPanelProps = {
  /** A facility name, its website, or a category such as "birou notarial". */
  query: string;
  title?: string;
  /** Inside a chat answer: shorter map, first few results. */
  compact?: boolean;
};

const COMPACT_LIMIT = 4;

export default function PlacesPanel({ query, title, compact = false }: PlacesPanelProps) {
  const { t, locale } = useI18n();
  const p = t.places;
  const state = usePlaces(query);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const km = (value: number) => value.toLocaleString(locale === "en" ? "en-GB" : locale, { maximumFractionDigits: 1 });

  if (state.status === "idle") return null;

  const places = state.status === "done" ? state.result.places : [];
  const visible = compact && !expanded ? places.slice(0, COMPACT_LIMIT) : places;

  return (
    <section className={styles.panel} data-compact={compact || undefined} aria-busy={state.status === "loading"}>
      {title && <h3 className={styles.panelTitle}>{title}</h3>}

      {state.status === "loading" && (
        <p className={styles.status} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          {p.loading}
        </p>
      )}
      {state.status === "error" && (
        <p className={styles.status} data-tone="error" role="alert">
          {p.error}
        </p>
      )}
      {state.status === "done" && places.length === 0 && (
        <p className={styles.status} data-tone="empty" role="status">
          {p.empty}
        </p>
      )}

      {places.length > 0 && (
        <>
          <PlaceMap places={visible} selectedId={selected} onSelect={setSelected} className={compact ? styles.mapCompact : undefined} />
          <p className={styles.count}>{places.length === 1 ? p.one : p.results.replace("{n}", String(places.length))}</p>
          <ol className={styles.list}>
            {visible.map((place, i) => (
              <PlaceCard
                key={place.id}
                n={i + 1}
                place={place}
                active={place.id === selected}
                onSelect={() => setSelected(place.id)}
                km={km}
              />
            ))}
          </ol>
          {compact && !expanded && places.length > COMPACT_LIMIT && (
            <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
              {p.showAll.replace("{n}", String(places.length))}
            </button>
          )}
          <p className={styles.note}>{p.note}</p>
        </>
      )}
    </section>
  );
}

type PlaceCardProps = {
  n: number;
  place: Place;
  active: boolean;
  onSelect: () => void;
  km: (value: number) => string;
};

function PlaceCard({ n, place, active, onSelect, km }: PlaceCardProps) {
  const { t } = useI18n();
  const p = t.places;
  return (
    <li className={styles.card} data-active={active || undefined}>
      <button type="button" className={styles.cardHead} onClick={onSelect} aria-pressed={active}>
        <span className={styles.num} aria-hidden="true">
          {n}
        </span>
        <span className={styles.cardTitle}>
          <strong>{place.name}</strong>
          <span className={styles.meta}>
            {p.categories[place.category]} · {p.fromCenter.replace("{km}", km(place.distanceKm))}
          </span>
        </span>
      </button>
      <dl className={styles.facts}>
        {place.address && (
          <div>
            <dt className="visually-hidden">{p.address}</dt>
            <dd>{place.address}</dd>
          </div>
        )}
        {place.openingHours && (
          <div>
            <dt>{p.hours}</dt>
            <dd>{place.openingHours}</dd>
          </div>
        )}
      </dl>
      <div className={styles.actions}>
        {place.phones.slice(0, 2).map((phone) => (
          <a key={phone} className={styles.action} data-kind="call" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
            {p.call}: {phone}
          </a>
        ))}
        {place.website && (
          <a className={styles.action} href={place.website} target="_blank" rel="noopener noreferrer">
            {p.website}
          </a>
        )}
        <a className={styles.action} href={place.directionsUrl} target="_blank" rel="noopener noreferrer">
          {p.directions}
        </a>
        <a className={styles.actionQuiet} href={place.osmUrl} target="_blank" rel="noopener noreferrer">
          {p.osm}
        </a>
      </div>
    </li>
  );
}
