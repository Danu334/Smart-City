import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ChatSidebar from "@/components/chat/ChatSidebar";
import Composer from "@/components/chat/Composer";
import Conversation from "@/components/chat/Conversation";
import DocViewer from "@/components/chat/DocViewer";
import EmptyState from "@/components/chat/EmptyState";
import Guide from "@/components/guide/Guide";
import { seedConversations } from "@/lib/corpus";
import { makeId, replyTo } from "@/lib/chatReply";
import { useI18n } from "@/lib/i18n";
import { useStoredFlag } from "@/lib/useStoredFlag";
import styles from "@/components/chat/Chat.module.css";

const COLLAPSE_KEY = "sc-chat-sidebar";
const THINK_MS = 700;
const NONE = "";

// Victor's first-visit tour: hello, history, sources, then the composer.
const CHAT_TOUR = [{}, { target: "chat-sidebar", radius: 14 }, {}, { target: "chat-composer", radius: 22, focus: true }];

export default function Chat() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [conversations, setConversations] = useState(seedConversations);
  const [pending, setPending] = useState(false);
  const [collapsed, setCollapsed] = useStoredFlag(COLLAPSE_KEY, false);
  const [drawer, setDrawer] = useState(false);
  const [width, setWidth] = useState(288);

  // These three follow the URL until the reader interacts, which keeps
  // /chat?c=…&doc=…&s=… linkable without any state-syncing effects.
  // `null` means "follow the URL"; the sentinels mean "the reader chose this".
  const [selected, setSelected] = useState(null);
  const [readerState, setReaderState] = useState(null);
  const [draft, setDraft] = useState(null);

  const trigger = useRef(null);
  const timers = useRef([]);

  const urlC = typeof router.query.c === "string" ? router.query.c : null;
  const urlQ = typeof router.query.q === "string" ? router.query.q : "";
  const urlDoc = typeof router.query.doc === "string" ? router.query.doc : null;
  const urlSection = typeof router.query.s === "string" ? router.query.s : null;

  const urlReader = useMemo(
    () => (urlDoc ? { docId: urlDoc, sectionId: urlSection, citations: [], index: 0 } : null),
    [urlDoc, urlSection],
  );

  const activeId = selected ?? urlC;
  const reader = readerState === null ? urlReader : readerState || null;
  const value = draft ?? urlQ;
  const active = activeId ? conversations.find((c) => c.id === activeId) ?? null : null;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /** Writes the shareable URL. Shallow, so no data fetching is re-run. */
  const go = useCallback(
    (next) => {
      const params = new URLSearchParams();
      if (next.c) params.set("c", next.c);
      if (next.doc) {
        params.set("doc", next.doc);
        if (next.s) params.set("s", next.s);
      }
      const search = params.toString();
      const target = search ? `/chat?${search}` : "/chat";
      if (router.asPath !== target) router.replace(target, undefined, { shallow: true });
    },
    [router],
  );

  const openConversation = (id) => {
    setSelected(id);
    setReaderState(false);
    setDrawer(false);
    go({ c: id });
  };

  const newConversation = () => {
    setSelected(NONE);
    setReaderState(false);
    setDraft("");
    setDrawer(false);
    go({});
  };

  const send = (text, files) => {
    const stamp = new Date().toISOString();
    const convId = activeId || makeId("c");
    const userMsg = {
      id: makeId(),
      role: "user",
      text,
      attachments: files.map((f) => ({ name: f.name, size: f.size })),
    };

    setConversations((prev) =>
      prev.some((c) => c.id === convId)
        ? prev.map((c) =>
            c.id === convId
              ? { ...c, stub: false, updatedAt: stamp, messages: [...c.messages, userMsg] }
              : c,
          )
        : [{ id: convId, title: text, locale, updatedAt: stamp, messages: [userMsg] }, ...prev],
    );
    setSelected(convId);
    setDraft("");
    setPending(true);
    go({ c: convId });

    timers.current.push(
      setTimeout(() => {
        const answer = replyTo(text, t);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, updatedAt: new Date().toISOString(), messages: [...c.messages, answer] }
              : c,
          ),
        );
        setPending(false);
      }, THINK_MS),
    );
  };

  const openCitation = (citation, citations, messageId, el) => {
    trigger.current = el;
    setReaderState({
      docId: citation.docId,
      sectionId: citation.sectionId,
      citations,
      messageId,
      index: Math.max(
        0,
        citations.findIndex((c) => c.n === citation.n),
      ),
    });
    go({ c: activeId, doc: citation.docId, s: citation.sectionId });
  };

  const stepCitation = (delta) => {
    if (!reader?.citations?.length) return;
    const next = (reader.index + delta + reader.citations.length) % reader.citations.length;
    const citation = reader.citations[next];
    setReaderState({ ...reader, index: next, docId: citation.docId, sectionId: citation.sectionId });
    go({ c: activeId, doc: citation.docId, s: citation.sectionId });
  };

  const closeReader = useCallback(() => {
    setReaderState(false);
    go({ c: activeId });
    trigger.current?.focus();
    trigger.current = null;
  }, [activeId, go]);

  const activeCitation = reader?.citations?.length
    ? { messageId: reader.messageId, n: reader.citations[reader.index]?.n }
    : null;

  return (
    <>
      <Head>
        <title>{`${t.chat.title} · ${t.brand.name}`}</title>
        <meta name="description" content={t.chat.empty.sub} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className={styles.shell}
        data-collapsed={collapsed}
        data-reader={Boolean(reader)}
        style={{ "--sidebar-w": `${width}px` }}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={openConversation}
          onNew={newConversation}
          collapsed={collapsed}
          onToggleCollapse={() => (drawer ? setDrawer(false) : setCollapsed(!collapsed))}
          open={drawer}
          onClose={() => setDrawer(false)}
          onResize={setWidth}
        />

        <main className={styles.main} id="main">
          <div className={styles.mainTop}>
            <button
              type="button"
              className={styles.drawerBtn}
              aria-expanded={drawer}
              aria-controls="chat-sidebar"
              onClick={() => setDrawer(true)}
            >
              <span className="visually-hidden">{t.chat.sidebar.expand}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
            <p className={styles.mainTitle}>{active ? active.title : t.chat.title}</p>
          </div>

          <div className={styles.scroller}>
            {active ? (
              <Conversation
                conversation={active}
                pending={pending}
                onOpenCitation={openCitation}
                activeCitation={activeCitation}
              />
            ) : (
              <EmptyState onPick={setDraft} />
            )}
          </div>

          <div id="chat-composer" className={styles.composerWrap}>
            <Composer value={value} onChange={setDraft} onSend={send} busy={pending} />
          </div>
        </main>

        {reader && (
          <DocViewer
            docId={reader.docId}
            sectionId={reader.sectionId}
            citations={reader.citations}
            index={reader.index}
            onStep={stepCitation}
            onClose={closeReader}
          />
        )}
      </div>

      <Guide tour="chat" steps={CHAT_TOUR} launcherPlace="top" />
    </>
  );
}
