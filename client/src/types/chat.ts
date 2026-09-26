// Shapes of the chat data (src/data/*.json) and of live conversations.

/** Colour/meaning of an answer state; matches StateIcon and the legend. */
export type Tone = "teal" | "amber" | "rose";

/** How well the documents answer: matches the colour legend (teal / amber / rose). */
export type AnswerStatus = "found" | "partial" | "not_found" | "contradiction";

/** Two or more passages that disagree on the same fact; each claim cites one. */
export type Contradiction = { topic: string; claims: { text: string; ref: number }[] };

/** Where to go: the institution responsible, with what the documents give about it. */
export type Institution = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
};

export type Block =
  | { type: "p"; text: string; refs?: number[] }
  | { type: "quote"; text: string; refs?: number[] }
  /** `itemRefs[i]` are the sources of step i. */
  | { type: "steps"; title?: string; items: string[]; itemRefs?: number[][]; refs?: number[] }
  /** The answer's state, shown first; `missing` and `contradictions` explain amber and rose. */
  | { type: "status"; status: AnswerStatus; missing?: string[]; contradictions?: Contradiction[]; refs?: number[] }
  /** Contact card for the institution to go to. */
  | ({ type: "institution"; refs?: number[] } & Institution)
  | { type: "flag"; tone?: Tone; title: string; text: string; refs?: number[] }
  /** Map + profiles for a facility name, its website, or a category ("birou notarial"). */
  | { type: "places"; query: string; title?: string; refs?: number[] };

export type Citation = {
  n: number;
  docId: string;
  sectionId: string;
  quote?: string;
  /** Search passages aren't in docs.json, so they carry their own document. */
  doc?: Doc;
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
  /** Markdown answer with inline [n] markers; `blocks` hold flags and maps. */
  text?: string;
  /** Still arriving from the server. */
  streaming?: boolean;
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
  /** When the source page or file was published, if it says; null = not stated. */
  published?: string | null;
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
