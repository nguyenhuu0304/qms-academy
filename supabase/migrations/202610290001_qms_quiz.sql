-- QMS Academy quiz attempts and daily leaderboard
-- Run this whole file once in Supabase Dashboard -> SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.qms_quiz_attempts (
  id uuid primary key,
  discord_id text not null,
  discord_name text not null,
  question_ids integer[] not null check (cardinality(question_ids) = 15),
  started_at timestamptz not null,
  expires_at timestamptz not null,
  submitted_at timestamptz,
  answers jsonb,
  score integer check (score between 0 and 15),
  total integer check (total = 15),
  passed boolean,
  certificate_id text unique,
  completed_at timestamptz,
  quiz_date date
);

create index if not exists qms_quiz_attempts_owner_idx
  on public.qms_quiz_attempts (discord_id, completed_at desc);

create table if not exists public.qms_quiz_results (
  id bigint generated always as identity primary key,
  discord_id text not null,
  discord_name text not null,
  quiz_date date not null,
  score integer not null check (score between 0 and 15),
  total integer not null check (total = 15),
  passed boolean not null,
  completed_at timestamptz not null,
  certificate_id text,
  unique (discord_id, quiz_date)
);

create index if not exists qms_quiz_results_daily_idx
  on public.qms_quiz_results (quiz_date, score desc, completed_at asc);

alter table public.qms_quiz_attempts enable row level security;
alter table public.qms_quiz_results enable row level security;

-- These tables are accessed only by server routes using the secret key.
revoke all on table public.qms_quiz_attempts from anon, authenticated;
revoke all on table public.qms_quiz_results from anon, authenticated;
grant select, insert, update, delete on table public.qms_quiz_attempts to service_role;
grant select, insert, update, delete on table public.qms_quiz_results to service_role;
grant usage, select on sequence public.qms_quiz_results_id_seq to service_role;

create or replace function public.qms_submit_quiz_attempt(
  p_attempt_id uuid,
  p_discord_id text,
  p_score integer,
  p_total integer,
  p_passed boolean,
  p_certificate_id text,
  p_completed_at timestamptz,
  p_quiz_date date,
  p_answers jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.qms_quiz_attempts%rowtype;
  v_daily_score integer;
  v_daily_completed_at timestamptz;
  v_daily_certificate_id text;
begin
  if p_score < 0 or p_score > 15 or p_total <> 15 or p_passed <> (p_score >= 12) then
    return jsonb_build_object('ok', false, 'error', 'invalid_score');
  end if;

  select * into v_attempt
  from public.qms_quiz_attempts
  where id = p_attempt_id and discord_id = p_discord_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'attempt_not_found');
  end if;
  if v_attempt.submitted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'attempt_already_submitted');
  end if;
  if v_attempt.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'attempt_expired');
  end if;

  update public.qms_quiz_attempts
  set submitted_at = p_completed_at,
      answers = p_answers,
      score = p_score,
      total = p_total,
      passed = p_passed,
      certificate_id = p_certificate_id,
      completed_at = p_completed_at,
      quiz_date = p_quiz_date
  where id = p_attempt_id;

  insert into public.qms_quiz_results (
    discord_id, discord_name, quiz_date, score, total, passed, completed_at, certificate_id
  ) values (
    p_discord_id, v_attempt.discord_name, p_quiz_date, p_score, p_total, p_passed, p_completed_at, p_certificate_id
  )
  on conflict (discord_id, quiz_date) do update
  set discord_name = excluded.discord_name,
      score = excluded.score,
      total = excluded.total,
      passed = excluded.passed,
      completed_at = excluded.completed_at,
      certificate_id = excluded.certificate_id
  where excluded.score > public.qms_quiz_results.score;

  select score, completed_at, certificate_id
  into v_daily_score, v_daily_completed_at, v_daily_certificate_id
  from public.qms_quiz_results
  where discord_id = p_discord_id and quiz_date = p_quiz_date;

  return jsonb_build_object(
    'ok', true,
    'attempt_score', p_score,
    'attempt_total', p_total,
    'attempt_passed', p_passed,
    'attempt_completed_at', p_completed_at,
    'attempt_certificate_id', p_certificate_id,
    'daily_best_score', v_daily_score,
    'is_daily_best', (v_daily_completed_at = p_completed_at and v_daily_score = p_score and coalesce(v_daily_certificate_id, '') = coalesce(p_certificate_id, ''))
  );
end;
$$;

revoke all on function public.qms_submit_quiz_attempt(uuid, text, integer, integer, boolean, text, timestamptz, date, jsonb) from public, anon, authenticated;
grant execute on function public.qms_submit_quiz_attempt(uuid, text, integer, integer, boolean, text, timestamptz, date, jsonb) to service_role;
