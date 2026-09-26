// Shapes of the chat data (src/data/*.json) and of live conversations.

/** Colour/meaning of an answer state; matches StateIcon and the legend. */
export type Tone = "teal" | "amber" | "rose";

export type Block =
  | { type: "p"; text: string; refs?: number[] }
  | { type: "quote"; text: string; refs?: number[] }
  | { type: "steps"; title?: string; items: string[]; refs?: number[] }
  | { type: "flag"; tone?: Tone; title: string; text: string; refs?: number[] };

export type Citation = {
  n: number;
  docId: string;
  sectionId: string;
  quote?: string;
};

export type Action = { label: string; href: string; platform?: string };

export type Attachment = { name: string; size: number };

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
  attachments?: Attachment[];
};

export type AssistantMessage = {
  id: string;
  role: "assistant";
  blocks: Block[];
  citations: Citation[];
  actions: Action[];
};

export type Message = UserMessage | AssistantMessage;

export type Conversation = {
  id: string;
  title: string;
  locale: string;
  updatedAt: string;
  messages: Message[];
  /** Demo history entry without saved messages. */
  stub?: boolean;
};

export type DocKind = "guide" | "law" | "registry";
export type Fidelity = "full" | "partial" | "record";

export type DocSection = { id: string; heading: string; paragraphs: string[] };

export type Doc = {
  id: string;
  kind: DocKind;
  title: string;
  issuer: string;
  reference: string;
  sourceUrl: string;
  retrieved: string;
  fidelity: Fidelity;
  sections: DocSection[];
};

/** A citation opened in the reader, with its neighbours for prev/next. */
export type ReaderState = {
  docId: string;
  sectionId: string | null;
  citations: Citation[];
  index: number;
  messageId?: string;
};

/** Open a citation in the reader; `trigger` gets focus back on close. */
export type OpenCitation = (citation: Citation, trigger: HTMLElement) => void;

/** Which citation marker is highlighted (the one open in the reader). */
export type ActiveCitation = { messageId?: string; n?: number } | null;
