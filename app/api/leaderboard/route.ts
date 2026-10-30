import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getVietnamDateKey, isDatabaseConfigurationError, supabaseRest } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaderboardRow = {
  discord_id: string;
  discord_name: string;
  score: number;
  total: number;
  rank_score: number;
  time_taken_seconds: number;
  completed_at: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const currentDiscordId = session?.user?.discordId ?? null;
  try {
    const date = getVietnamDateKey();
    const params = new URLSearchParams({
      select: "discord_id,discord_name,score,total,rank_score,time_taken_seconds,completed_at",
      quiz_date: `eq.${date}`,
      order: "rank_score.desc,score.desc,time_taken_seconds.asc,completed_at.asc",
      limit: "100"
    });
    const rows = await supabaseRest<LeaderboardRow[]>(`qms_quiz_results?${params.toString()}`);
    return NextResponse.json({ date, rows: rows.map(({ discord_id, ...row }) => ({ ...row, isCurrentUser: Boolean(currentDiscordId && discord_id === currentDiscordId) })) });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return NextResponse.json({ error: "Leaderboard database is not configured yet. Complete the setup in README.md." }, { status: 503 });
    }
    console.error("QMS leaderboard load failed.");
    return NextResponse.json({ error: "Could not load the leaderboard." }, { status: 503 });
  }
}
