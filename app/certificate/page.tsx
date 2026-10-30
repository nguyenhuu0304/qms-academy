"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useAppSettings } from "@/components/AppSettingsProvider";

type StoredResult = {
  score: number;
  total: number;
  passed: boolean;
  completedAt: string;
  certificateId: string;
  discordName: string;
  discordId: string;
  demoBypass?: boolean;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function fileToDataUrl(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load QMS logo.");
  }

  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(blob);
  });
}

export default function CertificatePage() {
  const { data: session, status } = useSession();
  const { t, locale } = useAppSettings();

  const [result, setResult] = useState<StoredResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadVerifiedResult() {
      try {
        const response = await fetch("/api/certificate", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          if (response.status !== 404 && !cancelled) setLoadError(data.error || "Could not load the verified certificate.");
          return;
        }
        if (!cancelled) setResult(data as StoredResult);
      } catch {
        if (!cancelled) setLoadError("Could not load the verified certificate. Please refresh the page.");
      }
    }

    if (status === "authenticated") void loadVerifiedResult();
    return () => { cancelled = true; };
  }, [status]);

  if (status === "loading") {
    return (
      <main className="cert-shell">
        <div className="container">{t("loading")}</div>
      </main>
    );
  }

  if (status !== "authenticated" || !result) {
    return (
      <main className="cert-shell">
        <div className="container">
          <div className="question-card result">
            <h2>{t("noCertificate")}</h2>

            <p className="section-sub">
              {t("certificatePrompt")}
            </p>

            {loadError ? <p role="alert" className="section-sub" style={{ color: "#ff8aa1" }}>{loadError}</p> : null}
            <Link className="btn btn-primary" href="/quiz">{t("goQuiz")}</Link>
          </div>
        </div>
      </main>
    );
  }

  const discordName =
    session.user?.name ??
    result.discordName ??
    "Discord user";

  const date = new Date(result.completedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  async function certificateSvg() {
    if (!result) return "";

    const logoData = await fileToDataUrl("/qms-logo-light.png");

    const safeName = escapeXml(discordName);
    const safeDate = escapeXml(date);
    const safeCertId = escapeXml(result.certificateId);
    const safeDiscordId = escapeXml(result.discordId || "");

    return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1600"
  height="1000"
  viewBox="0 0 1600 1000"
>
  <defs>
    <linearGradient id="borderGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6D28D9"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
  </defs>

  <rect width="1600" height="1000" fill="#F8F5FF"/>

  <circle cx="60" cy="40" r="150" fill="#EEE7FF"/>
  <circle cx="1540" cy="960" r="170" fill="#EEE7FF"/>

  <rect
    x="14"
    y="14"
    width="1572"
    height="972"
    rx="8"
    fill="none"
    stroke="url(#borderGradient)"
    stroke-width="12"
  />

  <rect
    x="30"
    y="30"
    width="1540"
    height="940"
    rx="4"
    fill="none"
    stroke="#8B5CF6"
    stroke-width="2"
  />

  <!-- QMS logo: transparent light-background variant for the certificate canvas -->
  <image
    href="${logoData}"
    x="748"
    y="78"
    width="104"
    height="57"
    preserveAspectRatio="xMidYMid meet"
  />

  <text
    x="800"
    y="190"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="24"
    font-weight="800"
    letter-spacing="5"
    fill="#7C3AED"
  >
    QMS ACADEMY
  </text>

  <text
    x="800"
    y="280"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="70"
    fill="#171021"
  >
    ${result.demoBypass ? "DEMO CERTIFICATE PREVIEW" : (locale === "vi" ? "Chứng nhận hoàn thành" : "Certificate of Completion")}
  </text>

  <text
    x="800"
    y="360"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="25"
    fill="#5D536D"
  >
    ${result.demoBypass ? (locale === "vi" ? "Bản xem trước dành cho" : "Preview created for") : (locale === "vi" ? "Chứng nhận rằng" : "This certifies that")}
  </text>

  <text
    x="800"
    y="485"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="62"
    fill="#171021"
  >
    ${safeName}
  </text>

  <line
    x1="570"
    y1="520"
    x2="1030"
    y2="520"
    stroke="#8B5CF6"
    stroke-width="2"
  />

  <text
    x="800"
    y="610"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="27"
    fill="#5D536D"
  >
    ${result.demoBypass ? (locale === "vi" ? "Bản xem trước này không xác nhận bạn đã hoàn thành bài đánh giá." : "This preview does not confirm completion of the assessment.") : (locale === "vi" ? "đã hoàn thành chương trình" : "has successfully completed the")}
  </text>

  <text
    x="800"
    y="655"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="28"
    font-weight="700"
    fill="#4D425D"
  >
    ${result.demoBypass ? (locale === "vi" ? "Bản xem trước trong quá trình phát triển" : "Temporary development preview") : (locale === "vi" ? "Học tập và Kiểm tra kiến thức QMS" : "QMS Fundamentals Learning &amp; Quiz")}
  </text>

  <text
    x="800"
    y="700"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="25"
    fill="#5D536D"
  >
    ${result.demoBypass ? (locale === "vi" ? "Không có kết quả học tập nào được xác minh." : "No learning result was verified.") : (locale === "vi" ? "và thể hiện sự hiểu biết về các khái niệm cốt lõi của QMS." : "and demonstrated an understanding of the core QMS concepts.")}
  </text>

  <text
    x="320"
    y="795"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="27"
    font-weight="800"
    fill="#171021"
  >
    ${result.score}/${result.total}
  </text>

  <text
    x="320"
    y="830"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="20"
    fill="#756B84"
  >
    Quiz score
  </text>

  <text
    x="800"
    y="795"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="27"
    font-weight="800"
    fill="#171021"
  >
    ${safeDate}
  </text>

  <text
    x="800"
    y="830"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="20"
    fill="#756B84"
  >
    Completion date
  </text>

  <text
    x="1280"
    y="795"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="27"
    font-weight="800"
    fill="#171021"
  >
    ${safeCertId}
  </text>

  <text
    x="1280"
    y="830"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="20"
    fill="#756B84"
  >
    Certificate ID
  </text>

  <text
    x="800"
    y="905"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17"
    fill="#776D86"
  >
    Discord: @${safeName}${safeDiscordId ? ` · ID ${safeDiscordId}` : ""}
  </text>

  <text
    x="800"
    y="935"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="17"
    fill="#776D86"
  >
    ${result.demoBypass ? "DEMO PREVIEW ONLY · " : ""}${locale === "vi" ? "Chứng nhận học tập cộng đồng — không phải chứng chỉ chính thức." : "Community learning certificate — not an official qualification."}
  </text>
</svg>
`;
  }

  async function downloadCertificate() {
    if (!result) return;

    setDownloading(true);

    try {
      const svg = await certificateSvg();

      const svgBlob = new Blob([svg], {
        type: "image/svg+xml;charset=utf-8"
      });

      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Certificate rendering failed."));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");

      canvas.width = 1600;
      canvas.height = 1000;

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(svgUrl);
        throw new Error("Canvas is not available.");
      }

      context.drawImage(image, 0, 0, 1600, 1000);

      URL.revokeObjectURL(svgUrl);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("PNG generation failed."));
            }
          },
          "image/png",
          1
        );
      });

      const downloadUrl = URL.createObjectURL(pngBlob);
      const anchor = document.createElement("a");

      anchor.href = downloadUrl;
      anchor.download = `QMS-Academy-${result.certificateId}.png`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 10000);
    } catch (error) {
      console.error(error);

      alert(
        "Could not download the certificate. Please check qms-logo-light.png and try again."
      );
    } finally {
      setDownloading(false);
    }
  }

  function shareOnX() {
    if (!result) return;

    const text = [
      `I just completed the QMS Academy Fundamentals Learning & Quiz with a score of ${result.score}/${result.total}.`,
      "",
      "Exploring QMS, Proof of Useful Work, post-quantum architecture and the QMS ecosystem.",
      "",
      `Certificate ID: ${result.certificateId}`,
      "",
      "@QMSnetwork",
      "#QMS #Web3Builder"
    ].join("\n");

    const shareUrl =
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(text);

    window.open(
      shareUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="cert-shell">
      <div className="container">
        {result.demoBypass ? <div className="demo-banner">{t("demoCertificate")}</div> : null}
        <section className="certificate">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px"
            }}
          >
            <img
              src="/qms-logo-light.png"
              alt="QMS"
              style={{
                width: "104px",
                height: "57px",
                objectFit: "contain"
              }}
            />

            <strong
              style={{
                color: "#171021",
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.03em"
              }}
            >
              QMS
            </strong>
          </div>

          <div className="cert-kicker">
            QMS ACADEMY {result.demoBypass ? "· DEMO PREVIEW" : ""}
          </div>

          <div className="cert-title">
            {result.demoBypass ? "DEMO CERTIFICATE PREVIEW" : t("certificateTitle")}
          </div>

          <p className="cert-copy">
            {result.demoBypass ? t("previewCreated") : t("certifies")}
          </p>

          <div className="cert-name">
            {discordName}
          </div>

          <p className="cert-copy">
            {result.demoBypass ? t("previewNotCompletion") : t("completedThe")}
            {!result.demoBypass ? <> <strong>{t("quizName")}</strong><br />{t("understoodQms")}</> : null}
          </p>

          <div className="cert-meta">
            <div>
              <b>{result.score}/{result.total}</b>
              <span>{t("quizScore")}</span>
            </div>
            <div>
              <b>{date}</b>
              <span>{t("completionDate")}</span>
            </div>
            <div>
              <b>{result.certificateId}</b>
              <span>{t("certificateIdLabel")}</span>
            </div>
          </div>

          <div className="cert-note">
            Discord: @{discordName}{result.discordId ? ` · ID ${result.discordId}` : ""}
            <br />
            {result.demoBypass ? "DEMO PREVIEW ONLY · " : ""}{t("communityDisclaimer")}
          </div>
        </section>

        <div className="cert-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={downloadCertificate}
            disabled={downloading}
          >
            {downloading ? t("preparingPng") : t("downloadCertificate")}
          </button>

          <button
            type="button"
            className="btn"
            onClick={shareOnX}
          >
            {t("shareX")}
          </button>

          <Link
            className="btn"
            href="/quiz"
          >
            {t("anotherQuiz")}
          </Link>

          <Link
            className="btn"
            href="/"
          >
            {t("home")}
          </Link>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "14px",
            fontSize: "12px",
            color: "#8E849F"
          }}
        >
          {t("downloadHint")}
        </p>
      </div>
    </main>
  );
}
