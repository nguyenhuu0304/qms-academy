import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { QUESTION_BANK, getQuestionExplanation } from "@/lib/questions";
import { getVietnamDateKey, isDatabaseConfigurationError, supabaseRest } from "@/lib/supabase-admin";

type AttemptRow = {
  id: string;
  discord_id: string;
  discord_name: string;
  question_ids: number[];
  started_at: string;
  expires_at: string;
  submitted_at: string | null;
};

type SubmitRpcResult = {
  ok?: boolean;
  error?: string;
  attempt_score?: number;
  attempt_total?: number;
  attempt_passed?: boolean;
  attempt_completed_at?: string;
  attempt_certificate_id?: string | null;
  daily_best_score?: number;
  daily_best_rank_score?: number;
  is_daily_best?: boolean;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.discordId;
  if (!discordId) {
    return NextResponse.json({ error: "Connect Discord before submitting the quiz." }, { status: 401 });
  }

  let body: { attemptId?: unknown; answers?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.attemptId !== "string" || body.attemptId.length > 80 || !body.attemptId) {
    return NextResponse.json({ error: "Quiz attempt is missing. Start a new quiz." }, { status: 400 });
  }
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Please answer all 15 questions." }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      select: "id,discord_id,discord_name,question_ids,started_at,expires_at,submitted_at",
      id: `eq.${body.attemptId}`,
      discord_id: `eq.${discordId}`,
      limit: "1"
    });
    const rows = await supabaseRest<AttemptRow[]>(`qms_quiz_attempts?${params.toString()}`);
    const attempt = rows[0];
    if (!attempt) {
      return NextResponse.json({ error: "Quiz attempt was not found for this Discord account." }, { status: 404 });
    }
    if (attempt.submitted_at) {
      return NextResponse.json({ error: "This quiz attempt has already been submitted." }, { status: 409 });
    }
    if (Date.now() > new Date(attempt.expires_at).getTime()) {
      return NextResponse.json({ error: "This quiz attempt expired. Please start a new quiz." }, { status: 410 });
    }
    if (!Array.isArray(attempt.question_ids) || attempt.question_ids.length !== 15) {
      return NextResponse.json({ error: "Quiz attempt data is invalid. Please start again." }, { status: 409 });
    }

    const submittedAnswers = body.answers as Record<string, unknown>;
    const expectedIds = new Set(attempt.question_ids.map(String));
    const suppliedIds = Object.keys(submittedAnswers);
    if (suppliedIds.length !== 15 || suppliedIds.some((id) => !expectedIds.has(id))) {
      return NextResponse.json({ error: "Answer set does not match this quiz." }, { status: 400 });
    }

    let verifiedScore = 0;
    const validatedAnswers: Record<string, number> = {};
    for (const questionId of attempt.question_ids) {
      const question = QUESTION_BANK.find((item) => item.id === questionId);
      const answer = submittedAnswers[String(questionId)];
      if (!question || typeof answer !== "number" || !Number.isInteger(answer) || answer < -1 || answer >= question.options.length) {
        return NextResponse.json({ error: "One or more answers are invalid." }, { status: 400 });
      }
      validatedAnswers[String(questionId)] = answer;
      if (answer >= 0 && answer === question.answer) verifiedScore += 1;
    }

    // Elapsed time is measured by the server, not trusted from the browser.
    const completedAt = new Date().toISOString();
    const rawElapsedSeconds = Math.ceil((Date.parse(completedAt) - Date.parse(attempt.started_at)) / 1000);
    const elapsedSeconds = Number.isFinite(rawElapsedSeconds)
      ? Math.min(1800, Math.max(0, rawElapsedSeconds))
      : 1800;
    const timeBonus = verifiedScore > 0
      ? Math.max(0, 99 - Math.floor(Math.min(elapsedSeconds, 300) * 99 / 300))
      : 0;

    // Temporary local preview only. This flag is ignored in production builds.
    const demoBypass = process.env.NODE_ENV !== "production" && process.env.QMS_DEV_CERTIFICATE_BYPASS === "true";
    const score = demoBypass ? 15 : verifiedScore;
    const rankScore = demoBypass ? 0 : (verifiedScore * 100 + timeBonus);
    const passed = score >= 12;
    const certificateId = passed
      ? `${demoBypass ? "QMS-DEMO" : "QMS"}-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`
      : null;
    const rpc = await supabaseRest<SubmitRpcResult>("rpc/qms_submit_quiz_attempt", {
      method: "POST",
      body: JSON.stringify({
        p_attempt_id: attempt.id,
        p_discord_id: discordId,
        p_score: score,
        p_total: 15,
        p_rank_score: rankScore,
        p_time_taken_seconds: elapsedSeconds,
        p_passed: passed,
        p_certificate_id: certificateId,
        p_completed_at: completedAt,
        // Demo results are stored under a non-current date so they never enter the live daily leaderboard.
        p_quiz_date: demoBypass ? "1970-01-01" : getVietnamDateKey(new Date(completedAt)),
        p_answers: validatedAnswers
      })
    });

    if (!rpc?.ok) {
      const status = rpc?.error === "attempt_expired" ? 410 : 409;
      return NextResponse.json({ error: "This attempt is no longer available. Start a new quiz." }, { status });
    }

    return NextResponse.json({
      score,
      total: 15,
      passed,
      completedAt,
      certificateId,
      discordName: attempt.discord_name,
      discordId,
      dailyBestScore: rpc.daily_best_score ?? score,
      rankScore,
      timeBonus: demoBypass ? 0 : timeBonus,
      timeTakenSeconds: elapsedSeconds,
      isDailyBest: demoBypass ? false : (rpc.is_daily_best ?? false),
      demoBypass,
      review: demoBypass ? [] : attempt.question_ids.map((questionId) => {
        const question = QUESTION_BANK.find((item) => item.id === questionId)!;
        const selectedAnswer = validatedAnswers[String(questionId)];
        return {
          id: question.id,
          category: question.category,
          question: question.question,
          options: question.options,
          selectedAnswer,
          correctAnswer: question.answer,
          explanation: getQuestionExplanation(question.id, "en"),
          explanationVi: getQuestionExplanation(question.id, "vi"),
          source: question.source
        };
      })
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return NextResponse.json({ error: "Quiz database is not configured yet. Complete the setup in README.md." }, { status: 503 });
    }
    console.error("QMS quiz submit failed.");
    return NextResponse.json({ error: "Could not verify the quiz result. Please try again." }, { status: 503 });
  }
}
