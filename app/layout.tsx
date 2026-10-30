import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AppSettingsProvider } from "@/components/AppSettingsProvider";

export const metadata: Metadata = {
  title: "QMS Academy",
  description: "Community-built QMS learning quiz and certificate prototype."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="qms-theme-bootstrap" strategy="beforeInteractive">{`try { const saved = localStorage.getItem("qms-academy-theme"); document.documentElement.dataset.theme = saved === "light" ? "light" : "dark"; } catch (_) { document.documentElement.dataset.theme = "dark"; }`}</Script>
      </head>
      <body>
        <SessionProvider>
          <AppSettingsProvider>
            <Header />
            {children}
            <Footer />
          </AppSettingsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
