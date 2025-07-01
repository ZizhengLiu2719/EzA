-- Quiz Battle MVP schema ---------------------------------------------------
-- Creates sessions, participants, answers tables + RLS policies
-- Run order: after existing flashcards schema.

-- Sessions -----------------------------------------------------------------
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  pin char(6) unique not null,
  host_id uuid references auth.users(id),
  flashcard_set_id uuid references flashcard_sets(id),
  status text check (status in ('waiting','playing','ended')) default 'waiting',
  current_q int default 0,
  created_at timestamptz default now()
);

-- Participants --------------------------------------------------------------
create table if not exists quiz_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references quiz_sessions(id) on delete cascade,
  user_id uuid references auth.users(id), -- null = guest
  nickname text not null,
  score int default 0,
  joined_at timestamptz default now()
);

-- Answers ------------------------------------------------------------------
create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references quiz_participants(id) on delete cascade,
  flashcard_id uuid references flashcards(id),
  chosen_idx int,
  is_correct boolean,
  latency_ms int,
  answered_at timestamptz default now()
);

-- Row Level Security --------------------------------------------------------
alter table quiz_sessions enable row level security;
alter table quiz_participants enable row level security;
alter table quiz_answers enable row level security;

-- Sessions RLS: host or participant can read
create policy "session_read" on quiz_sessions
  for select using (
    auth.uid() = host_id
    or id in (select session_id from quiz_participants where user_id = auth.uid())
  );

-- Participants RLS: participant can read self; host can read all
create policy "participant_read" on quiz_participants
  for select using (
    auth.uid() = user_id
    or session_id in (select id from quiz_sessions where host_id = auth.uid())
  );

-- Answers RLS: participant can read own answers; host can read all
create policy "answers_read" on quiz_answers
  for select using (
    participant_id in (
      select id from quiz_participants where user_id = auth.uid()
    )
    or participant_id in (
      select qp.id from quiz_participants qp
      join quiz_sessions qs on qs.id = qp.session_id
      where qs.host_id = auth.uid()
    )
  );

-- Helper stored procedure to safely increment participant.score
create or replace function increment_participant_score(
  p_participant_id uuid,
  p_delta int
) returns void as $$
begin
  update quiz_participants
    set score = score + p_delta
  where id = p_participant_id;
end;
$$ language plpgsql security definer; 