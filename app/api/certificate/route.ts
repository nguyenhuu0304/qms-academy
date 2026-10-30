import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigurationError, supabaseRest } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CertificateRow = {
  score: number;
  total: number;
  passed: boolean;
  completed_at: string;
  certificate_id: string | null;
  discord_name: string;
  discord_id: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const discordId = session?.user?.discordId;
  if (!discordId) return NextResponse.json({ error: "Connect Discord first." }, { status: 401 });

  try {
    const params = new URLSearchParams({
      select: "score,total,passed,completed_at,certificate_id,discord_name,discord_id",
      discord_id: `eq.${discordId}`,
      passed: "eq.true",
      certificate_id: "not.is.null",
      order: "completed_at.desc",
      limit: "1"
    });
    const rows = await supabaseRest<CertificateRow[]>(`qms_quiz_attempts?${params.toString()}`);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "No verified passing result was found." }, { status: 404 });

    return NextResponse.json({
      score: row.score,
      total: row.total,
      passed: row.passed,
      completedAt: row.completed_at,
      certificateId: row.certificate_id,
      discordName: row.discord_name,
      discordId: row.discord_id,
      demoBypass: Boolean(row.certificate_id?.startsWith("QMS-DEMO-"))
    });
  } catch (error) {
    if (isDatabaseConfigurationError(error)) {
      return NextResponse.json({ error: "Quiz database is not configured yet. Complete the setup in README.md." }, { status: 503 });
    }
    console.error("QMS certificate lookup failed.");
    return NextResponse.json({ error: "Could not load the verified certificate." }, { status: 503 });
  }
}
