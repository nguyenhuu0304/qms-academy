"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppSettings } from "@/components/AppSettingsProvider";

type LeaderboardEntry = { discord_name: string; score: number; total: number; rank_score: number; time_taken_seconds: number; completed_at: string; isCurrentUser?: boolean };

export default function LeaderboardPage() {
  const { t, locale } = useAppSettings();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load leaderboard.");
        if (!cancelled) { setRows(data.rows ?? []); setDate(data.date ?? ""); }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="learn-shell">
      <div className="container">
        <div className="eyebrow">QMS Academy</div>
        <h1 className="learn-title">{t("dailyLeaderboard")}</h1>
        <p className="lead">{locale === "vi" ? "Xếp hạng ưu tiên số câu đúng; điểm thưởng thời gian chỉ dùng để phân hạng khi chênh lệch độ chính xác không đủ một câu. Mỗi tài khoản lấy kết quả tốt nhất trong ngày (UTC+7)." : "Accuracy comes first. A capped time bonus ranks players with comparable accuracy. Each Discord account keeps its best daily result (UTC+7)."}</p>
        <section className="question-card" style={{ marginTop: 28 }}>
          <div className="module-header">
            <div>
              <h2 className="section-title" style={{ marginBottom: 6 }}>{t("todayResults")}</h2>
              <p className="section-sub" style={{ marginBottom: 0 }}>{date ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(`${date}T12:00:00+07:00`)) : (locale === "vi" ? "Ngày Việt Nam" : "Vietnam local date")}</p>
            </div>
            <Link className="btn" href="/quiz">{t("takeQuiz")}</Link>
          </div>
          {loading ? <p className="section-sub">{t("loadingVerified")}</p> : null}
          {error ? <p role="alert" className="section-sub" style={{ color: "#ff8aa1" }}>{error}</p> : null}
          {!loading && !error && rows.length === 0 ? (
            <div className="leaderboard-empty">
              <div className="empty-trophy" aria-hidden="true">🏆</div>
              <h3>{locale === "vi" ? "Bảng xếp hạng đang chờ người đầu tiên" : "The leaderboard is waiting for its first player"}</h3>
              <p className="section-sub">{t("noResults")}</p>
              <Link className="btn btn-primary" href="/quiz">{t("takeQuiz")}</Link>
            </div>
          ) : null}
          {!loading && !error && rows.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
                <thead><tr style={{ color: "var(--muted)", textAlign: "left" }}>
                  <th style={{ padding: "14px 12px" }}>{t("rank")}</th><th style={{ padding: "14px 12px" }}>{t("discord")}</th><th style={{ padding: "14px 12px", textAlign: "right" }}>{t("bestScore")}</th><th style={{ padding: "14px 12px", textAlign: "right" }}>{locale === "vi" ? "Điểm xếp hạng" : "Rank points"}</th><th style={{ padding: "14px 12px", textAlign: "right" }}>{locale === "vi" ? "Thời lượng" : "Duration"}</th>
                </tr></thead>
                <tbody>{rows.map((row, i) => (
                  <tr key={`${row.discord_name}-${row.completed_at}`} className={row.isCurrentUser ? "leaderboard-current-user" : "leaderboard-row"}>
                    <td style={{ padding: "16px 12px", fontWeight: 800 }}>{i + 1}</td>
                    <td style={{ padding: "16px 12px", fontWeight: 700 }}>{row.discord_name || "Discord user"}{row.isCurrentUser ? <span className="you-chip">{locale === "vi" ? "Bạn" : "You"}</span> : null}</td>
                    <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 800 }}>{row.score}/{row.total}</td>
                    <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 800 }}>{row.rank_score}</td>
                    <td style={{ padding: "16px 12px", textAlign: "right", color: "var(--muted)" }}>{Math.floor(row.time_taken_seconds / 60)}:{String(row.time_taken_seconds % 60).padStart(2, "0")}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : null}
        </section>
        <p className="helper-copy" style={{ marginTop: 18 }}>{locale === "vi" ? "Cách tính: mỗi câu đúng = 100 điểm; cộng tối đa 99 điểm thưởng thời gian. Số câu đúng luôn được ưu tiên trước điểm thời gian." : "Scoring: 100 points per correct answer, plus up to 99 time-bonus points. Accuracy always ranks ahead of speed."}</p>
        <p className="helper-copy" style={{ marginTop: 8 }}>{t("leaderboardNote")}</p>
      </div>
    </main>
  );
}
