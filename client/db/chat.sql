-- Chat history, next to Better Auth's tables on Neon. Safe to re-run.
-- A conversation belongs to a signed-in user OR to an anonymous guest
-- (random id in the httpOnly "sc-guest" cookie). Guest conversations move
-- to the account on the first chat request after sign-in.

create table if not exists chat_conversation (
  id         text primary key,
  user_id    text references "user"(id) on delete cascade,
  guest_id   text,
  title      text not null,
  locale     text not null default 'ro',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_conversation_owner check (user_id is not null or guest_id is not null)
);

create index if not exists chat_conversation_user_idx on chat_conversation (user_id, updated_at desc);
create index if not exists chat_conversation_guest_idx on chat_conversation (guest_id, updated_at desc);

create table if not exists chat_message (
  id              text primary key,
  conversation_id text not null references chat_conversation(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  -- role = user: the question
  text            text,
  -- role = assistant: { text, blocks, citations, actions }
  content         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists chat_message_conversation_idx on chat_message (conversation_id, created_at);
