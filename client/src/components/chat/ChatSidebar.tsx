import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import Logo, { LogoMark } from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import StateIcon, { ANSWER_TONES as LEGEND_TONES } from "@/components/StateIcon";
import { useI18n } from "@/lib/i18n";
import { groupByRecency, normalize } from "@/lib/corpus";
import type { Conversation } from "@/types/chat";
import styles from "./Chat.module.css";

const MIN_W = 240;
const MAX_W = 420;

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 5v10M5 10h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.2a1.3 1.3 0 001.3 1.3h4a1.3 1.3 0 001.3-1.3L14 6M8.7 9v4.5M11.3 9v4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4v12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

type ChatSidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  /** Removes a conversation; rejects if it couldn't be deleted. */
  onDelete: (id: string) => Promise<void>;
  /** Desktop: narrowed to a rail. */
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Phones: shown as a drawer. */
  open: boolean;
  onClose: () => void;
  /** New sidebar width in px while dragging the edge. */
  onResize: (width: number) => void;
};

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  collapsed,
  onToggleCollapse,
  open,
  onClose,
  onResize,
}: ChatSidebarProps) {
  const { t } = useI18n();
  const s = t.chat.sidebar;
  const [filter, setFilter] = useState("");
  const dragging = useRef(false);
  // The conversation asking "Delete?", and whether its deletion is running or failed.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<"idle" | "busy" | "failed">("idle");

  const ask = (id: string | null) => {
    setConfirming(id);
    setDeleting("idle");
  };
  const remove = async (id: string) => {
    setDeleting("busy");
    try {
      await onDelete(id);
      ask(null);
    } catch {
      setDeleting("failed");
    }
  };

  const groups = useMemo(() => {
    const q = normalize(filter.trim());
    const list = q ? conversations.filter((c) => normalize(c.title).includes(q)) : conversations;
    return groupByRecency(list, s);
  }, [conversations, filter, s]);

  const startResize = (ev: ReactPointerEvent<HTMLDivElement>) => {
    ev.preventDefault();
    dragging.current = true;
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      onResize(Math.min(MAX_W, Math.max(MIN_W, e.clientX)));
    };
    const stop = () => {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return (
    <>
      <div className={styles.scrim} data-open={open} onClick={onClose} aria-hidden="true" />

      <aside id="chat-sidebar" className={styles.sidebar} data-open={open} aria-label={s.history}>
        <div className={styles.sidebarTop}>
          <Logo />
          {/* Open as a drawer this button closes it; docked, it collapses the column. */}
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onToggleCollapse}
            aria-expanded={open ? true : !collapsed}
            aria-controls="chat-sidebar"
            title={open ? t.nav.close : collapsed ? s.expand : s.collapse}
          >
            <span className="visually-hidden">{open ? t.nav.close : collapsed ? s.expand : s.collapse}</span>
            <PanelIcon />
          </button>
        </div>

        <button type="button" className={styles.newChat} onClick={onNew}>
          <PlusIcon />
          {s.newChat}
        </button>

        <label className={styles.filter}>
          <span className="visually-hidden">{s.filter}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={filter}
            placeholder={s.filter}
            onChange={(ev) => setFilter(ev.target.value)}
          />
        </label>

        <nav className={styles.history} aria-label={s.history}>
          {groups.length === 0 && <p className={styles.historyEmpty}>{s.filterEmpty}</p>}
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className={styles.groupLabel}>{group.label}</h2>
              <ul>
                {group.items.map((c) => (
                  <li key={c.id} className={styles.historyRow}>
                    {confirming === c.id ? (
                      <div className={styles.historyConfirm} role="group" aria-label={s.deleteConfirm}>
                        <p>{deleting === "failed" ? s.deleteFailed : s.deleteConfirm}</p>
                        <div>
                          <button
                            type="button"
                            className={styles.historyDelete}
                            onClick={() => remove(c.id)}
                            disabled={deleting === "busy"}
                            aria-busy={deleting === "busy"}
                            autoFocus
                          >
                            {s.deleteYes}
                          </button>
                          <button type="button" className={styles.historyCancel} onClick={() => ask(null)}>
                            {s.deleteNo}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.historyItem}
                          aria-current={c.id === activeId ? "true" : undefined}
                          onClick={() => onSelect(c.id)}
                        >
                          <span>{c.title}</span>
                        </button>
                        <button
                          type="button"
                          className={styles.historyTrash}
                          onClick={() => ask(c.id)}
                          title={s.deleteChat}
                        >
                          <span className="visually-hidden">{`${s.deleteChat}: ${c.title}`}</span>
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        {/* Colour key for the three kinds of answer, same icons as the home page. */}
        <details className={styles.legend} open>
          <summary className={styles.legendTitle}>{s.legend.title}</summary>
          <ul>
            {t.honesty.cards.map(([name], i) => (
              <li key={name} className={styles.legendItem} data-tone={LEGEND_TONES[i]}>
                <span className={styles.legendIcon}>
                  <StateIcon tone={LEGEND_TONES[i]} />
                </span>
                <span>
                  <strong>{name}</strong>
                  <span className={styles.legendText}>{s.legend.items[i]}</span>
                </span>
              </li>
            ))}
          </ul>
        </details>

        <div className={styles.sidebarFoot}>
          <LanguageSwitch />
          <Link href="/" className={styles.footLink}>
            {s.backHome}
          </Link>
        </div>

        <div
          className={styles.resizer}
          onPointerDown={startResize}
          role="separator"
          aria-orientation="vertical"
          aria-label={s.resize}
        />
      </aside>

      {/* Slim rail left behind when the sidebar is collapsed on desktop. */}
      <div className={styles.rail} aria-hidden={!collapsed}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onToggleCollapse}
          aria-expanded={false}
          aria-controls="chat-sidebar"
          tabIndex={collapsed ? 0 : -1}
        >
          <span className="visually-hidden">{s.expand}</span>
          <PanelIcon />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onNew}
          tabIndex={collapsed ? 0 : -1}
          title={s.newChat}
        >
          <span className="visually-hidden">{s.newChat}</span>
          <PlusIcon />
        </button>
        <Link href="/" className={styles.railBrand} tabIndex={collapsed ? 0 : -1}>
          <LogoMark size={24} />
          <span className="visually-hidden">{s.backHome}</span>
        </Link>
      </div>
    </>
  );
}
