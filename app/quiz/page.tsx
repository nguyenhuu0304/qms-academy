"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useAppSettings } from "@/components/AppSettingsProvider";

type QuizQuestion = {
  id: number;
  category: string;
  question: string;
  options: string[];
};

type QuizReviewItem = {
  id: number; category: string; question: string; options: string[];
  selectedAnswer: number; correctAnswer: number; explanation: string; explanationVi: string; source: string;
};

type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
  certificateId: string | null;
  discordName: string;
  discordId: string;
  dailyBestScore: number;
  rankScore?: number;
  timeBonus?: number;
  timeTakenSeconds?: number;
  isDailyBest: boolean;
  demoBypass?: boolean;
  review?: QuizReviewItem[];
};

export default function QuizPage() {
  const { data: session, status } = useSession();
  const { t, locale } = useAppSettings();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [demoBypassAvailable, setDemoBypassAvailable] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(20);
  const startRequested = useRef(false);

  async function startQuiz() {
    setLoading(true);
    setError("");
    setResult(null);
    setQuestions([]);
    setAttemptId("");
    setDemoBypassAvailable(false);
    setIndex(0);
    setAnswers({});
    try {
      const response = await fetch("/api/quiz/start", { method: "POST", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start the quiz.");
      setAttemptId(data.attemptId);
      setDemoBypassAvailable(Boolean(data.demoBypassAvailable));
      setQuestions(data.questions as QuizQuestion[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the quiz.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && !startRequested.current) {
      startRequested.current = true;
      void startQuiz();
    }
  }, [status]);

  const current = questions[index];
  const selected = current ? answers[current.id] : undefined;
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;

  function choose(optionIndex: number) {
    if (!current || result || submitting) return;
    setAnswers((previous) => ({ ...previous, [current.id]: optionIndex }));
  }

  function next() {
    if (selected === undefined || selected < 0) return;
    if (index < questions.length - 1) setIndex((value) => value + 1);
  }

  useEffect(() => {
    if (!current || result || submitting || demoBypassAvailable) return;
    const deadline = Date.now() + 20_000;
    setRemainingSeconds(20);
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        window.clearInterval(timer);
        setAnswers((previous) => ({ ...previous, [current.id]: previous[current.id] ?? -1 }));
        if (index < questions.length - 1) setIndex((value) => value + 1);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [index, current?.id, result, submitting, demoBypassAvailable, questions.length]);

  async function submitQuiz() {
    if (!attemptId || questions.length !== 15 || submitting) return;
    if (!demoBypassAvailable && !questions.every((question) => Number.isInteger(answers[question.id]))) {
      setError(t("answerAll"));
      return;
    }
    const answersToSubmit = demoBypassAvailable
      ? Object.fromEntries(questions.map((question) => [question.id, Number.isInteger(answers[question.id]) ? answers[question.id] : 0]))
      : answers;

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: answersToSubmit })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not verify the result.");
      setResult(data as QuizResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the result.");
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    startRequested.current = true;
    void startQuiz();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (status === "loading" || (status === "authenticated" && loading && questions.length === 0)) {
    return <main className="quiz-shell"><div className="question-card loading-card" role="status" aria-live="polite"><span className="loading-orb" aria-hidden="true" /><strong>{t("loading")}</strong><div className="skeleton-line" /><div className="skeleton-line short" /></div></main>;
  }

  if (status !== "authenticated") {
    return (
      <main className="quiz-shell">
        <div className="question-card result">
          <div className="eyebrow">{t("discordRequired")}</div>
          <h2>{t("connectBeforeQuiz")}</h2>
          <p className="section-sub">{t("discordIdentityText")}</p>
          <button className="btn btn-primary" onClick={() => signIn("discord", { callbackUrl: "/quiz" })}>{t("connectDiscord")}</button>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="quiz-shell">
        <div className="question-card result">
          <div className="eyebrow">{result.demoBypass ? t("demoPass") : t("serverVerified")}</div>
          {result.demoBypass ? <div className="demo-banner">{t("demoPass")}</div> : null}
          <div className={`score ${result.passed ? "pass" : "fail"}`}>{result.score}/{result.total}</div>
          <h2>{result.passed ? t("congratulations") : t("notYet")}</h2>
          <p className="section-sub">
            {result.passed
              ? (result.demoBypass ? t("demoPassCopy") : t("passedCopy"))
              : t("need12")}
          </p>
          {result.demoBypass ? <p className="section-sub">{t("demoNotRanked")}</p> : (
            <div className="result-metrics">
              <div className="result-metric"><span>{locale === "vi" ? "Kết quả lượt này" : "This attempt"}</span><strong>{result.score}/15</strong></div>
              <div className="result-metric"><span>{locale === "vi" ? "Điểm tốt nhất hôm nay" : "Today’s best"}</span><strong>{result.dailyBestScore}/15</strong></div>
              <div className="result-metric"><span>{locale === "vi" ? "Điểm xếp hạng" : "Rank points"}</span><strong>{result.rankScore ?? result.score * 100}</strong></div>
              <div className="result-metric"><span>{locale === "vi" ? "Thời gian" : "Time"}</span><strong>{Math.floor((result.timeTakenSeconds ?? 0) / 60)}:{String((result.timeTakenSeconds ?? 0) % 60).padStart(2, "0")}</strong></div>
            </div>
          )}
          {result.passed && result.certificateId ? <p className="section-sub" style={{ marginTop: 18 }}>{t("certificateId")} <strong>{result.certificateId}</strong></p> : null}
          <div className="hero-actions result-actions">
            {result.passed ? <Link className="btn btn-primary" href="/certificate">{t("viewCertificate")}</Link> : <Link className="btn btn-primary" href="/learn">{t("reviewModule")}</Link>}
            <button className="btn" onClick={retry} disabled={loading}>{loading ? t("preparing") : t("tryAgain")}</button>
            <Link className="btn" href="/leaderboard">{t("dailyLeaderboard")}</Link>
          </div>
          {!result.demoBypass && result.review?.length ? (
            <section className="answer-review" aria-labelledby="answer-review-title">
              <div className="eyebrow">{locale === "vi" ? "ÔN TẬP SAU BÀI KIỂM TRA" : "POST-QUIZ REVIEW"}</div>
              <h3 id="answer-review-title">{locale === "vi" ? "Xem lại câu trả lời" : "Review your answers"}</h3>
              <p className="section-sub">{locale === "vi" ? "Đáp án và giải thích được tải sau khi máy chủ xác minh bài làm." : "Correct answers and explanations are shown only after the server verifies your submission."}</p>
              <div className="review-list">
                {result.review?.map((item, reviewIndex) => {
                  const correct = item.selectedAnswer === item.correctAnswer;
                  return (
                    <article className={`review-item ${correct ? "review-correct" : "review-incorrect"}`} key={item.id}>
                      <div className="review-item-head"><strong>{locale === "vi" ? `Câu ${reviewIndex + 1}` : `Question ${reviewIndex + 1}`}</strong><span className={correct ? "review-status good" : "review-status bad"}>{correct ? (locale === "vi" ? "Đúng" : "Correct") : (locale === "vi" ? "Chưa đúng" : "Incorrect")}</span></div>
                      <h4>{item.question}</h4>
                      <div className="review-answer"><span>{locale === "vi" ? "Bạn chọn" : "Your answer"}</span><strong>{item.selectedAnswer >= 0 ? item.options[item.selectedAnswer] : (locale === "vi" ? "Hết giờ / bỏ trống" : "Timed out / unanswered")}</strong></div>
                      <div className="review-answer correct-answer"><span>{locale === "vi" ? "Đáp án đúng" : "Correct answer"}</span><strong>{item.options[item.correctAnswer]}</strong></div>
                      <p className="review-explanation">{locale === "vi" ? item.explanationVi : item.explanation}</p>
                      <small>{locale === "vi" ? "Nguồn tham khảo: " : "Reference: "}{item.source}</small>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
          {error ? <p role="alert" className="section-sub" style={{ color: "#ff8aa1", marginTop: 20 }}>{error}</p> : null}
        </div>
      </main>
    );
  }

  if (loading || questions.length !== 15 || !attemptId || !current) {
    return (
      <main className="quiz-shell">
        <div className="question-card result">
          <div className="eyebrow">{t("quizTitle")}</div>
          <h2>{error ? t("quizStartError") : t("preparing")}</h2>
          {error ? <p role="alert" className="section-sub" style={{ color: "#ff8aa1" }}>{error}</p> : <p className="section-sub">{t("quizPreparingText")}</p>}
          {error ? <button className="btn btn-primary" onClick={retry}>{t("tryAgain")}</button> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="quiz-shell">
      <div className="quiz-top">
        <div>
          <div className="eyebrow">{t("quizTitle")}</div>
          <strong>{t("question")} {index + 1} {t("of")} {questions.length}</strong>
        </div>
        <Link className="btn" href="/leaderboard">{t("dailyLeaderboard")}</Link>
      </div>
      <div className="progress" style={{ marginBottom: 18 }}><div style={{ width: `${progress}%` }} /></div>
      {!demoBypassAvailable ? (
        <div className="timer-row" role="timer" aria-live="polite" aria-atomic="true" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <span className="section-sub" style={{ margin: 0 }}>{locale === "vi" ? "Thời gian còn lại cho câu này" : "Time left for this question"}</span>
          <strong className={remainingSeconds <= 5 ? "timer-urgent" : "timer-value"} style={{ fontSize: 22, fontVariantNumeric: "tabular-nums" }}>{`00:${String(remainingSeconds).padStart(2, "0")}`}</strong>
        </div>
      ) : null}
      <section className="question-card">
        {demoBypassAvailable ? <div className="demo-banner">{t("demoPass")} · {locale === "vi" ? "Bạn có thể tạo chứng chỉ mẫu mà không cần trả lời câu hỏi." : "You can create a preview certificate without answering."}<div style={{ marginTop: 10 }}><button className="btn btn-primary" type="button" onClick={submitQuiz} disabled={submitting}>{submitting ? t("verifying") : t("createDemoCertificate")}</button></div></div> : null}
        {locale === "vi" ? <p className="user-id">{t("quizQuestionsEnglish")}</p> : null}
        <h2 className="question-title">{current.question}</h2>
        <div className="options">
          {current.options.map((option, optionIndex) => (
            <button
              type="button"
              className={`option ${selected === optionIndex ? "selected" : ""}`}
              key={`${current.id}-${optionIndex}`}
              onClick={() => choose(optionIndex)}
              aria-pressed={selected === optionIndex}
              disabled={submitting || (answers[current.id] !== undefined && answers[current.id] < 0)}
            >
              <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>
        {error ? <p role="alert" className="section-sub" style={{ color: "#ff8aa1", marginTop: 18, marginBottom: 0 }}>{error}</p> : null}
        <div className="quiz-actions">
          {index < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={next} disabled={selected === undefined || selected < 0 || submitting}>{t("next")}</button>
          ) : (
            <button className="btn btn-primary" onClick={submitQuiz} disabled={submitting || (!demoBypassAvailable && selected === undefined)}>{submitting ? t("verifying") : (demoBypassAvailable ? t("createDemoCertificate") : t("submitQuiz"))}</button>
          )}
        </div>
        <p className="helper-copy" style={{ marginTop: 16 }}>{t("answersServer")}</p>
      </section>
    </main>
  );
}
