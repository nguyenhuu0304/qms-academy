-- QMS Academy v0.2.2: server-timed ranking fields and atomic daily-best update.
-- Run this migration once in Supabase Dashboard -> SQL Editor after the v0.2.1 migration.

alter table public.qms_quiz_attempts
  add column if not exists rank_score integer not null default 0,
  add column if not exists time_taken_seconds integer not null default 0;

alter table public.qms_quiz_results
  add column if not exists rank_score integer not null default 0,
  add column if not exists time_taken_seconds integer not null default 0;

-- Preserve the relative ordering of existing results before the new timing bonus is used.
update public.qms_quiz_attempts
set rank_score = score * 100, time_taken_seconds = 300
where score is not null and rank_score = 0;

update public.qms_quiz_results
set rank_score = score * 100, time_taken_seconds = 300
where rank_score = 0;

create index if not exists qms_quiz_results_daily_rank_idx
  on public.qms_quiz_results (quiz_date, rank_score desc, score desc, time_taken_seconds asc, completed_at asc);

-- Replace the previous RPC signature so score and duration are stored atomically.
drop function if exists public.qms_submit_quiz_attempt(
  uuid, text, integer, integer, boolean, text, timestamptz, date, jsonb
);

create function public.qms_submit_quiz_attempt(
  p_attempt_id uuid,
  p_discord_id text,
  p_score integer,
  p_total integer,
  p_rank_score integer,
  p_time_taken_seconds integer,
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
  v_daily_rank_score integer;
  v_daily_completed_at timestamptz;
  v_daily_certificate_id text;
  v_daily_time_taken_seconds integer;
begin
  if p_score < 0 or p_score > 15
     or p_total <> 15
     or p_rank_score < 0 or p_rank_score > 1599
     or p_time_taken_seconds < 0 or p_time_taken_seconds > 1800
     or p_passed <> (p_score >= 12) then
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
      rank_score = p_rank_score,
      time_taken_seconds = p_time_taken_seconds,
      passed = p_passed,
      certificate_id = p_certificate_id,
      completed_at = p_completed_at,
      quiz_date = p_quiz_date
  where id = p_attempt_id;

  insert into public.qms_quiz_results (
    discord_id, discord_name, quiz_date, score, total, rank_score,
    time_taken_seconds, passed, completed_at, certificate_id
  ) values (
    p_discord_id, v_attempt.discord_name, p_quiz_date, p_score, p_total,
    p_rank_score, p_time_taken_seconds, p_passed, p_completed_at, p_certificate_id
  )
  on conflict (discord_id, quiz_date) do update
  set discord_name = excluded.discord_name,
      score = excluded.score,
      total = excluded.total,
      rank_score = excluded.rank_score,
      time_taken_seconds = excluded.time_taken_seconds,
      passed = excluded.passed,
      completed_at = excluded.completed_at,
      certificate_id = excluded.certificate_id
  where excluded.rank_score > public.qms_quiz_results.rank_score
     or (excluded.rank_score = public.qms_quiz_results.rank_score and excluded.score > public.qms_quiz_results.score)
     or (excluded.rank_score = public.qms_quiz_results.rank_score and excluded.score = public.qms_quiz_results.score and excluded.time_taken_seconds < public.qms_quiz_results.time_taken_seconds);

  select score, rank_score, completed_at, certificate_id, time_taken_seconds
  into v_daily_score, v_daily_rank_score, v_daily_completed_at, v_daily_certificate_id, v_daily_time_taken_seconds
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
    'daily_best_rank_score', v_daily_rank_score,
    'is_daily_best', (v_daily_completed_at = p_completed_at
      and v_daily_rank_score = p_rank_score
      and v_daily_score = p_score
      and v_daily_time_taken_seconds = p_time_taken_seconds
      and coalesce(v_daily_certificate_id, '') = coalesce(p_certificate_id, ''))
  );
end;
$$;

revoke all on function public.qms_submit_quiz_attempt(
  uuid, text, integer, integer, integer, integer, boolean, text, timestamptz, date, jsonb
) from public, anon, authenticated;
grant execute on function public.qms_submit_quiz_attempt(
  uuid, text, integer, integer, integer, integer, boolean, text, timestamptz, date, jsonb
) to service_role;
