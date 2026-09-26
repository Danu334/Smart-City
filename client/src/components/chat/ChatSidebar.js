import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Logo, { LogoMark } from "@/components/Logo";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useI18n } from "@/lib/i18n";
import { groupByRecency, normalize } from "@/lib/corpus";
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

function PanelIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4v12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  collapsed,
  onToggleCollapse,
  open,
  onClose,
  onResize,
}) {
  const { t } = useI18n();
  const s = t.chat.sidebar;
  const [filter, setFilter] = useState("");
  const dragging = useRef(false);

  const groups = useMemo(() => {
    const q = normalize(filter.trim());
    const list = q ? conversations.filter((c) => normalize(c.title).includes(q)) : conversations;
    return groupByRecency(list, s);
  }, [conversations, filter, s]);

  const startResize = (ev) => {
    ev.preventDefault();
    dragging.current = true;
    const move = (e) => {
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
                  <li key={c.id}>
                    <button
                      type="button"
                      className={styles.historyItem}
                      aria-current={c.id === activeId ? "true" : undefined}
                      onClick={() => onSelect(c.id)}
                    >
                      <span>{c.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

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
