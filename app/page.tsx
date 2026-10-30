"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAppSettings } from "@/components/AppSettingsProvider";

export default function HomePage() {
  const { status } = useSession();
  const { t } = useAppSettings();
  const connected = status === "authenticated";

  return (
    <main className="home-shell">
      <div className="container">
        <section className="home-hero">
          <div>
            <div className="eyebrow">{t("homeEyebrow")}</div>
            <h1>{t("homeTitle")}</h1>
            <p className="lead">{t("homeLead")}</p>
            <div className="hero-actions">
              <Link href={connected ? "/learn" : "/quiz"} className="btn btn-primary">{t("startLearning")}</Link>
              <Link href="/ecosystem" className="btn">{t("exploreEcosystem")}</Link>
            </div>
          </div>
          <div className="hero-card">
            <div className="eyebrow">QMS ACADEMY</div>
            <h2 className="section-title">{t("homeFlow")}</h2>
            <p className="section-sub">A community-led learning experience. The certificate is a community learning record, not an official QMS qualification.</p>
            <div className="home-stats">
              <div className="home-stat"><strong>06</strong><span>{t("statTopics")}</span></div>
              <div className="home-stat"><strong>60</strong><span>{t("statQuestions")}</span></div>
              <div className="home-stat"><strong>15</strong><span>{t("statPerAttempt")}</span></div>
              <div className="home-stat"><strong>12/15</strong><span>{t("statPass")}</span></div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">{t("howItWorks")}</h2>
          <p className="section-sub">{t("homeLead")}</p>
          <div className="card-grid">
            <article className="card"><div className="icon">01</div><h3>{t("stepLearn")}</h3><p>{t("stepLearnDesc")}</p></article>
            <article className="card"><div className="icon">02</div><h3>{t("stepQuiz")}</h3><p>{t("stepQuizDesc")}</p></article>
            <article className="card"><div className="icon">03</div><h3>{t("stepCertificate")}</h3><p>{t("stepCertDesc")}</p></article>
          </div>
        </section>
      </div>
    </main>
  );
}
