import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pickRandomQuestions } from "@/lib/questions";
import { isDatabaseConfigurationError, supabaseRest } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.discordId;
  if (!discordId) {
    return NextResponse.json({ error: "Connect Discord before starting the quiz." }, { status: 401 });
  }

  try {
    const questions = pickRandomQuestions(15);
    if (questions.length !== 15) {
      return NextResponse.json({ error: "The quiz question bank is not ready." }, { status: 500 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const attemptId = randomUUID();
    const discordName = (session.user?.name || "Discord user").slice(0, 100);

    await supabaseRest("qms_quiz_attempts", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id: attemptId,
        discord_id: discordId,
        discord_name: discordName,
        question_ids: questions.map((question) => question.id),
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
    });

    return NextResponse.json({
      attemptId,
      demoBypassAvailable: process.env.NODE_ENV !== "production" && process.env.QMS_DEV_CERTIFICATE_BYPASS === "true",
      expiresAt: expiresAt.toISOString(),
      questions: questions.map(({ id, category, question, options }) => ({ id, category, question, options }))
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return NextResponse.json({ error: "Quiz database is not configured yet. Complete the setup in README.md." }, { status: 503 });
    }
    console.error("QMS quiz start failed.");
    return NextResponse.json({ error: "Could not start the quiz. Please try again." }, { status: 503 });
  }
}
