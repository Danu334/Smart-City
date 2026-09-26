import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ChatSidebar from "@/components/chat/ChatSidebar";
import Composer from "@/components/chat/Composer";
import Conversation from "@/components/chat/Conversation";
import DocViewer from "@/components/chat/DocViewer";
import EmptyState from "@/components/chat/EmptyState";
import Guide from "@/components/guide/Guide";
import AccountNudge, { nudgeDismissed } from "@/components/chat/AccountNudge";
import type { StatusPhase } from "@/components/chat/Conversation";
import { useSession } from "@/lib/auth-client";
import { fetchConversation, fetchConversations, importConversations, streamChat } from "@/lib/chatApi";
import { makeId } from "@/lib/ids";
import { messagePlainText } from "@/lib/chat/plain";
import { saveGuestChats, takeGuestChats } from "@/lib/guestChats";
import { useI18n } from "@/lib/i18n";
import { cssVars } from "@/lib/css";
import type {
  AssistantMessage,
  Block,
  Citation,
  Conversation as ConversationData,
  ReaderState,
  UserMessage,
} from "@/types/chat";
import { useStoredFlag } from "@/lib/useStoredFlag";
import styles from "@/components/chat/Chat.module.css";

const COLLAPSE_KEY = "sc-chat-sidebar";
const NONE = "";

// Victor's first-visit tour: hello, history, sources, then the composer.
const CHAT_TOUR = [{}, { target: "chat-sidebar", radius: 14 }, {}, { target: "chat-composer", radius: 22, focus: true }];

export default function Chat() {
  const { t, locale } = useI18n();
  const router = useRouter();

  // Signed in: history is saved on the server. Visitors can chat too, but
  // their conversation stays on this page (nothing is stored for them).
  const { data: session, isPending: sessionPending } = useSession();
  const userId = session?.user.id ?? null;

  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [pending, setPending] = useState(false);
  const [statusPhase, setStatusPhase] = useState<StatusPhase | null>(null);
  // "An account gives you more" notice, shown to a visitor after an answer.
  const [nudge, setNudge] = useState(false);
  const [collapsed, setCollapsed] = useStoredFlag(COLLAPSE_KEY, false);
  const [drawer, setDrawer] = useState(false);
  const [width, setWidth] = useState(288);

  // These three follow the URL until the reader interacts, which keeps
  // /chat?c=…&doc=…&s=… linkable without any state-syncing effects.
  // `null` means "follow the URL"; the sentinels mean "the reader chose this".
  const [selected, setSelected] = useState<string | null>(null);
  // false = the reader closed it; null = follow ?doc= in the URL
  const [readerState, setReaderState] = useState<ReaderState | false | null>(null);
  const [draft, setDraft] = useState<string | null>(null);

  const trigger = useRef<HTMLElement | null>(null);
  const abort = useRef<AbortController | null>(null);
  // Whose history is on screen; undefined until the first load.
  const loadedFor = useRef<string | null | undefined>(undefined);

  const urlC = typeof router.query.c === "string" ? router.query.c : null;
  const urlQ = typeof router.query.q === "string" ? router.query.q : "";
  const urlDoc = typeof router.query.doc === "string" ? router.query.doc : null;
  const urlSection = typeof router.query.s === "string" ? router.query.s : null;

  const urlReader = useMemo<ReaderState | null>(
    () => (urlDoc ? { docId: urlDoc, sectionId: urlSection, citations: [], index: 0 } : null),
    [urlDoc, urlSection],
  );

  const activeId = selected ?? urlC;
  const reader = readerState === null ? urlReader : readerState || null;
  const value = draft ?? urlQ;
  const active = activeId ? conversations.find((c) => c.id === activeId) ?? null : null;

  useEffect(() => () => abort.current?.abort(), []);

  // The list comes without messages; fetch the open thread's messages.
  const needsMessages = Boolean(activeId && active && !active.messages.length);
  useEffect(() => {
    if (!activeId || !needsMessages) return;
    let cancelled = false;
    fetchConversation(activeId)
      .then((full) => {
        if (cancelled) return;
        setConversations((prev) => prev.map((c) => (c.id === full.id ? full : c)));
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [activeId, needsMessages]);

  /** Writes the shareable URL. Shallow, so no data fetching is re-run. */
  const go = useCallback(
    (next: { c?: string | null; doc?: string; s?: string | null }) => {
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

  const openConversation = (id: string) => {
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

  const send = async (text: string, files: File[]) => {
    const stamp = new Date().toISOString();
    const existing = activeId ? conversations.find((c) => c.id === activeId) : undefined;
    const existingId = existing?.id ?? null;
    const guest = !userId;
    const userMsg: UserMessage = {
      id: makeId(),
      role: "user",
      text,
      attachments: files.map((f) => ({ name: f.name, size: f.size })),
    };
    const assistantId = makeId();
    const placeholder: AssistantMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      blocks: [],
      citations: [],
      actions: [],
      streaming: true,
    };
    // The local id is swapped for the server's once the "meta" event arrives.
    const track = { convId: existingId ?? makeId("c") };

    const patchAssistant = (update: (m: AssistantMessage) => AssistantMessage) =>
      setConversations((prev) =>
        prev.map((c) =>
          c.messages.some((m) => m.id === assistantId)
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === assistantId && m.role === "assistant" ? update(m) : m)),
              }
            : c,
        ),
      );

    const fail = (message: string) =>
      patchAssistant((m) => ({
        ...m,
        streaming: false,
        blocks: [{ type: "flag", tone: "amber", title: t.chat.answer.errorTitle, text: message } satisfies Block],
      }));

    setConversations((prev) =>
      existingId
        ? prev.map((c) =>
            c.id === existingId
              ? { ...c, stub: false, updatedAt: stamp, messages: [...c.messages, userMsg, placeholder] }
              : c,
          )
        : [{ id: track.convId, title: text, locale, updatedAt: stamp, messages: [userMsg, placeholder] }, ...prev],
    );
    setSelected(track.convId);
    setDraft("");
    setPending(true);
    setStatusPhase("think");
    go({ c: track.convId });

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    let streamed = "";

    try {
      await streamChat({
        // A visitor's conversation only exists here, so its earlier turns go along.
        conversationId: guest ? null : existingId,
        history: guest
          ? existing?.messages.map((m) => ({ role: m.role, text: messagePlainText(m) })).filter((m) => m.text)
          : undefined,
        message: text,
        locale,
        signal: controller.signal,
        onEvent: (event) => {
          switch (event.type) {
            case "meta": {
              const localId = track.convId;
              track.convId = event.conversationId;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === localId
                    ? {
                        ...c,
                        id: event.conversationId,
                        title: event.title || c.title,
                        messages: c.messages.map((m) => (m.id === userMsg.id ? { ...m, id: event.userMessageId } : m)),
                      }
                    : c,
                ),
              );
              setSelected(event.conversationId);
              go({ c: event.conversationId });
              break;
            }
            case "status":
              setStatusPhase(event.phase);
              break;
            case "token":
              streamed += event.text;
              setStatusPhase(null);
              patchAssistant((m) => ({ ...m, text: streamed }));
              break;
            case "citations":
              patchAssistant((m) => ({ ...m, citations: event.citations }));
              break;
            case "done":
              patchAssistant(() => ({
                id: event.messageId,
                role: "assistant",
                text: event.text,
                blocks: event.blocks,
                citations: event.citations,
                actions: event.actions,
              }));
              if (guest && !nudgeDismissed()) setNudge(true);
              break;
            case "error":
              fail(event.message);
              break;
          }
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      fail(err instanceof Error && err.message ? err.message : t.chat.answer.errorText);
    } finally {
      if (abort.current === controller) {
        setPending(false);
        setStatusPhase(null);
      }
    }
  };

  // Just signed in from the chat: save the conversations had as a visitor.
  const importGuestChats = useEffectEvent(async () => {
    const waiting = takeGuestChats();
    if (!waiting.length) return;
    try {
      await importConversations(waiting, locale);
      const list = await fetchConversations();
      setConversations(list);
      if (list[0]) openConversation(list[0].id);
    } catch (err) {
      console.error(err);
    }
  });

  // Load the history list, and again after sign-in or sign-out.
  useEffect(() => {
    if (sessionPending) return;
    let cancelled = false;
    fetchConversations()
      .then((list) => {
        if (cancelled) return;
        const switched = loadedFor.current !== undefined && loadedFor.current !== userId;
        loadedFor.current = userId;
        setConversations((prev) => {
          if (switched) return list;
          // Keep threads already open here (with messages, maybe mid-answer).
          const open = new Map(prev.filter((c) => c.messages.length).map((c) => [c.id, c]));
          const listed = new Set(list.map((c) => c.id));
          return [...prev.filter((c) => open.has(c.id) && !listed.has(c.id)), ...list.map((c) => open.get(c.id) ?? c)];
        });
        if (userId) void importGuestChats();
      })
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [userId, sessionPending]);

  const openCitation = (citation: Citation, citations: Citation[], messageId: string, el: HTMLElement) => {
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

  const stepCitation = (delta: number) => {
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
        style={cssVars({ "--sidebar-w": `${width}px` })}
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
                statusPhase={statusPhase}
                onOpenCitation={openCitation}
                activeCitation={activeCitation}
              />
            ) : (
              <EmptyState onPick={setDraft} />
            )}
          </div>

          <div id="chat-composer" className={styles.composerWrap}>
            {nudge && !userId && (
              <AccountNudge onClose={() => setNudge(false)} onLeave={() => saveGuestChats(conversations)} />
            )}
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
