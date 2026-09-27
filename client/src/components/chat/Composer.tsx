import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useI18n } from "@/lib/i18n";
import { formatBytes } from "@/lib/corpus";
import styles from "./Chat.module.css";

const MAX_H = 200;

function ClipIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M12.5 7.5l-4.6 4.6a1.7 1.7 0 002.4 2.4l4.9-4.9a3.4 3.4 0 00-4.8-4.8L5 9.9a5 5 0 007 7l3.2-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Attachments stay in the browser; only names and sizes are shown. */
  onSend: (text: string, files: File[]) => void;
  busy: boolean;
};

export default function Composer({ value, onChange, onSend, busy }: ComposerProps) {
  const { t } = useI18n();
  const s = t.chat.composer;
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);

  // Grow with the text, then scroll.
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(MAX_H, el.scrollHeight)}px`;
  }, [value]);

  const addFiles = (list: FileList | null | undefined) => {
    const incoming = Array.from(list ?? []);
    if (!incoming.length) return;
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !names.has(f.name))];
    });
  };

  const submit = (ev?: FormEvent<HTMLFormElement>) => {
    ev?.preventDefault();
    const text = value.trim();
    if (!text || busy) return area.current?.focus();
    onSend(text, files);
    setFiles([]);
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      submit();
    }
  };

  return (
    <form
      className={styles.composer}
      data-dragging={dragging}
      onSubmit={submit}
      onDragOver={(ev) => {
        ev.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(ev) => {
        ev.preventDefault();
        setDragging(false);
        addFiles(ev.dataTransfer?.files);
      }}
    >
      {files.length > 0 && (
        <ul className={styles.attachments} aria-label={s.attachments}>
          {files.map((file) => (
            <li key={file.name}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((f) => f.name !== file.name))}
              >
                <span className="visually-hidden">{`${s.remove}: ${file.name}`}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.composerRow}>
        <label htmlFor="chat-input" className="visually-hidden">
          {s.placeholder}
        </label>
        <textarea
          id="chat-input"
          ref={area}
          rows={1}
          value={value}
          placeholder={s.placeholder}
          onChange={(ev) => onChange(ev.target.value)}
          onKeyDown={onKeyDown}
        />

        <button
          type="button"
          className={styles.attachBtn}
          onClick={() => picker.current?.click()}
          title={s.attach}
        >
          <span className="visually-hidden">{s.attach}</span>
          <ClipIcon />
        </button>
        <input
          ref={picker}
          type="file"
          multiple
          className="visually-hidden"
          onChange={(ev) => {
            addFiles(ev.target.files);
            ev.target.value = "";
          }}
        />

        <button type="submit" className={styles.sendBtn} disabled={busy || !value.trim()}>
          <span className="visually-hidden">{s.send}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h11M11 5.5L15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {dragging && <p className={styles.composerHint}>{s.dropHere}</p>}
    </form>
  );
}
