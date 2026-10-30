"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useAppSettings } from "@/components/AppSettingsProvider";

export default function Header() {
  const { data: session, status } = useSession();
  const { locale, setLocale, theme, toggleTheme, t } = useAppSettings();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <Image src={theme === "dark" ? "/qms-logo-dark.png" : "/qms-logo-light.png"} alt="QMS" width={86} height={30} priority />
          <span className="brand-badge">Academy</span>
        </Link>

        <nav className="nav" aria-label="Main navigation">
          <Link className="btn btn-ghost" href="/learn">{t("learn")}</Link>
          <Link className="btn btn-ghost" href="/quiz">{t("quiz")}</Link>
          <Link className="btn btn-ghost" href="/leaderboard">{t("leaderboard")}</Link>
          <Link className="btn btn-ghost" href="/ecosystem">{t("ecosystem")}</Link>
          <div className="settings-controls">
            <div className="locale-switch" role="group" aria-label={t("language")}>
              <button type="button" className={locale === "en" ? "locale-option active" : "locale-option"} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button>
              <button type="button" className={locale === "vi" ? "locale-option active" : "locale-option"} onClick={() => setLocale("vi")} aria-pressed={locale === "vi"}>VI</button>
            </div>
            <button className="icon-button" type="button" onClick={toggleTheme} aria-label={theme === "dark" ? (locale === "vi" ? "Chuyển sang giao diện sáng" : "Switch to light theme") : (locale === "vi" ? "Chuyển sang giao diện tối" : "Switch to dark theme")} title={theme === "dark" ? t("light") : t("dark")} aria-pressed={theme === "light"}>
              <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
            </button>
          </div>
          {status === "authenticated" ? (
            <div className="auth-box">
              {session.user?.image ? <img className="avatar" src={session.user.image} alt="Discord avatar" /> : null}
              <div>
                <div className="user-name">{session.user?.name ?? "Discord user"}</div>
                <div className="user-id">{t("connected")}</div>
              </div>
              <button className="btn" onClick={() => signOut({ callbackUrl: "/" })}>{t("signOut")}</button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => signIn("discord", { callbackUrl: "/learn" })}>
              {t("connectDiscord")}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
