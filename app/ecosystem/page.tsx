"use client";

import { useAppSettings } from "@/components/AppSettingsProvider";

const resources = [
  { key: "officialWebsite", url: "https://qms.finance", detail: "Project overview, protocol information and official announcements.", detailVi: "Tổng quan dự án, thông tin giao thức và thông báo chính thức." },
  { key: "docs", url: "https://docs.qms.finance", detail: "Guides and technical documentation for users and developers.", detailVi: "Hướng dẫn và tài liệu kỹ thuật dành cho người dùng, nhà phát triển." },
  { key: "whitepaper", url: "https://docs.qms.finance/whitepaper", detail: "The QMS architecture, Proof of Useful Work and protocol design.", detailVi: "Kiến trúc QMS, Proof of Useful Work và thiết kế giao thức." },
  { key: "testnetGuide", url: "https://qms.finance/news/welcome-to-qms-testnet", detail: "Official guide to connect a wallet and explore QMS Testnet.", detailVi: "Hướng dẫn chính thức để kết nối ví và trải nghiệm QMS Testnet." },
  { key: "faucet", url: "https://faucet.testnet.qms.finance", detail: "Request free QMS test tokens for network fees.", detailVi: "Nhận QMS test token miễn phí để trả phí giao dịch trên testnet." },
  { key: "status", url: "https://status.testnet.qms.finance", detail: "Check the current availability of QMS Testnet services.", detailVi: "Kiểm tra tình trạng hoạt động của các dịch vụ QMS Testnet." },
  { key: "explorer", url: "https://testnet.qmsscan.io", detail: "Inspect blocks, transactions and wallet addresses.", detailVi: "Tra cứu block, giao dịch và địa chỉ ví." },
  { key: "qwap", url: "https://testnet.qwap.xyz", detail: "Try test-token swaps and liquidity on the QMS testnet DEX.", detailVi: "Thử hoán đổi token và cung cấp thanh khoản trên DEX testnet QMS." },
  { key: "discordLink", url: "https://discord.com/invite/qmsnetwork", detail: "Join the QMS community and ask for support.", detailVi: "Tham gia cộng đồng QMS và trao đổi khi cần hỗ trợ." },
  { key: "xLink", url: "https://x.com/QMSNetwork", detail: "Follow official news and ecosystem updates.", detailVi: "Theo dõi tin tức và cập nhật hệ sinh thái chính thức." },
  { key: "telegram", url: "https://t.me/s/QMSNetworkOfficial", detail: "Read announcements from the official Telegram channel.", detailVi: "Theo dõi thông báo từ kênh Telegram chính thức." },
  { key: "builderProgram", url: "https://qms.finance/builders-program", detail: "Learn about the QMS Builder Program and applications.", detailVi: "Tìm hiểu chương trình QMS Builder và cách đăng ký." }
];

export default function EcosystemPage() {
  const { t, locale } = useAppSettings();
  return (
    <main className="learn-shell">
      <div className="container">
        <div className="eyebrow">QMS ACADEMY</div>
        <h1 className="learn-title">{t("ecosystemTitle")}</h1>
        <p className="lead">{t("ecosystemIntro")}</p>
        <div className="ecosystem-grid">
          {resources.map((item) => (
            <article className="ecosystem-card" key={item.key}>
              <h3>{t(item.key)}</h3>
              <p>{locale === "vi" ? item.detailVi : item.detail}</p>
              <a href={item.url} target="_blank" rel="noopener noreferrer">{item.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗</a>
            </article>
          ))}
        </div>
        <p className="user-id" style={{ marginTop: 24 }}>Use testnet tokens only. Never share your seed phrase or private key with anyone.</p>
      </div>
    </main>
  );
}
