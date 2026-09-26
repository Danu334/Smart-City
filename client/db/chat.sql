-- Chat history, next to Better Auth's tables on Neon. Safe to re-run.
-- Only signed-in users have saved conversations: a visitor's question waits
-- in their browser until they sign in, so nothing about them is stored here.

create table if not exists chat_conversation (
  id         text primary key,
  user_id    text not null references "user"(id) on delete cascade,
  title      text not null,
  locale     text not null default 'ro',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_conversation_user_idx on chat_conversation (user_id, updated_at desc);

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

-- Upgrade from the first version, which also kept anonymous guest chats.
delete from chat_conversation where user_id is null;
alter table chat_conversation drop constraint if exists chat_conversation_owner;
alter table chat_conversation alter column user_id set not null;
drop index if exists chat_conversation_guest_idx;
alter table chat_conversation drop column if exists guest_id;
