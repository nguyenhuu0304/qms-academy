"use client";

import Link from "next/link";
import { useAppSettings } from "@/components/AppSettingsProvider";

export default function Footer() {
  const { t } = useAppSettings();
  return (
    <footer className="footer">
      <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <span>QMS Academy v0.2.3 · {t("footer")}</span>
        <Link href="/ecosystem">{t("ecosystem")} ↗</Link>
      </div>
    </footer>
  );
}
