"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Locale = "en" | "vi";
type Theme = "dark" | "light";
type AppSettings = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  t: (key: string) => string;
};

const translations: Record<Locale, Record<string, string>> = {
  en: {
    learn: "Learn", quiz: "Quiz", leaderboard: "Leaderboard", ecosystem: "Ecosystem",
    connectDiscord: "Connect Discord", signOut: "Sign out", connected: "Discord connected",
    language: "Language", theme: "Theme", light: "Light", dark: "Dark",
    homeEyebrow: "COMMUNITY LEARNING PROTOTYPE", homeTitle: "Learn QMS. Understand the network.",
    homeLead: "A community learning hub for QMS fundamentals, testnet exploration and builder resources.", homeFlow: "Learn → Explore → Build", statTopics: "Learning topics", statQuestions: "Quiz questions", statPerAttempt: "Questions per attempt", statPass: "Passing score", stepLearnDesc: "Explore the QMS fundamentals module, one topic at a time.", stepQuizDesc: "Answer a randomized set of 15 questions from the community question bank.", stepCertDesc: "Complete the assessment and unlock your Discord-linked learning certificate.", discordIdentityText: "Your verified Discord identity is used for quiz attempts and certificates.", quizStartError: "Quiz could not start", quizPreparingText: "A server-generated set of 15 questions is being prepared.", loadingVerified: "Loading verified results…",
    startLearning: "Start learning", previewModule: "Preview module", exploreEcosystem: "Explore ecosystem",
    howItWorks: "How it works", stepLearn: "Learn", stepQuiz: "Take the quiz", stepCertificate: "Get a certificate",
    learnTitle: "QMS Fundamentals", learnIntro: "Explore each topic and build a practical understanding of QMS.",
    lessonContentEnglish: "Lesson text is currently available in English.", quizQuestionsEnglish: "Quiz questions and answer choices are currently in English.",
    quizTitle: "QMS Fundamentals Quiz", question: "Question", of: "of", previous: "Previous", next: "Next",
    submitQuiz: "Submit quiz", createDemoCertificate: "Create demo certificate", verifying: "Verifying…", preparing: "Preparing your quiz…", loading: "Loading…",
    discordRequired: "Discord required", connectBeforeQuiz: "Connect Discord before taking the quiz.",
    serverVerified: "Server verified", congratulations: "Congratulations — you passed.",
    notYet: "Not quite yet.", passedCopy: "Your QMS Academy completion certificate is unlocked.",
    need12: "You need at least 12 correct answers. Review the module and try again.",
    dailyBest: "Today’s best score for your Discord account:", certificateId: "Certificate ID:",
    viewCertificate: "View certificate", tryAgain: "Try another random set", reviewModule: "Review module",
    dailyLeaderboard: "Daily leaderboard", answerAll: "Please answer all 15 questions before submitting.",
    answersServer: "Each question has 20 seconds. When time runs out, it is marked incorrect and the quiz moves on. Ranking prioritizes correct answers, then a capped time bonus.",
    noCertificate: "No unlocked certificate yet.", certificatePrompt: "Connect Discord and complete the QMS Fundamentals Quiz to unlock your certificate.",
    goQuiz: "Go to quiz", todayResults: "Today’s best results", takeQuiz: "Take the quiz",
    noResults: "No quiz results have been recorded today yet. Be the first to take the quiz.",
    rank: "Rank", discord: "Discord", bestScore: "Best score", time: "Time",
    leaderboardNote: "The leaderboard uses server-verified results. Demo certificates are excluded.",
    ecosystemTitle: "Explore the QMS ecosystem", ecosystemIntro: "Official QMS resources and testnet tools. Always verify links before connecting a wallet.",
    officialWebsite: "Official website", docs: "Documentation", whitepaper: "Whitepaper", testnetGuide: "Testnet guide",
    faucet: "Testnet faucet", status: "Network status", explorer: "Block explorer", qwap: "QWAP testnet DEX",
    discordLink: "Discord community", xLink: "QMS on X", telegram: "Telegram updates", builderProgram: "Builder Program",
    demoPass: "DEMO PASS · temporary preview", demoPassCopy: "A temporary demo certificate has been created for preview. It is not a verified learning result.", demoNotRanked: "Demo result is not included in the live leaderboard.", demoCertificate: "Demo certificate — temporary preview only. This is not a verified learning result.",
    footer: "Community learning prototype · Not an official QMS qualification.", startQuiz: "Start quiz", connectAndStart: "Connect Discord & start quiz", backHome: "Back home", readyToTest: "Ready to test yourself?", randomSet: "15 random questions from the 60-question bank", freshSet: "No question repeats within the same attempt. A new attempt generates a fresh random set.", backTopics: "Back to all topics", keyPoints: "Key points to remember", downloadCertificate: "Download certificate", preparingPng: "Preparing PNG…", shareX: "Share on X", anotherQuiz: "Take another quiz", home: "Home", certificateTitle: "Certificate of Completion", certifies: "This certifies that", completedThe: "has successfully completed the", quizName: "QMS Fundamentals Learning & Quiz", understoodQms: "and demonstrated an understanding of the core QMS concepts.", quizScore: "Quiz score", completionDate: "Completion date", certificateIdLabel: "Certificate ID", communityDisclaimer: "Community learning certificate — not an official qualification.", previewCreated: "Preview created for", previewNotCompletion: "This preview does not confirm completion of the assessment.", demoDevelopmentPreview: "Temporary development preview", downloadHint: "Download your certificate first, then attach the PNG when posting on X."
  },
  vi: {
    learn: "Học tập", quiz: "Kiểm tra", leaderboard: "Bảng xếp hạng", ecosystem: "Hệ sinh thái",
    connectDiscord: "Kết nối Discord", signOut: "Đăng xuất", connected: "Đã kết nối Discord",
    language: "Ngôn ngữ", theme: "Giao diện", light: "Sáng", dark: "Tối",
    homeEyebrow: "NỀN TẢNG HỌC TẬP CỘNG ĐỒNG", homeTitle: "Tìm hiểu QMS. Khám phá mạng lưới.",
    homeLead: "Không gian học tập cộng đồng về kiến thức nền tảng QMS, trải nghiệm testnet và tài nguyên cho builder.", homeFlow: "Học tập → Khám phá → Xây dựng", statTopics: "Chủ đề học tập", statQuestions: "Câu hỏi kiểm tra", statPerAttempt: "Câu hỏi mỗi lượt", statPass: "Điểm đạt", stepLearnDesc: "Khám phá kiến thức nền tảng QMS theo từng chủ đề.", stepQuizDesc: "Trả lời 15 câu hỏi ngẫu nhiên từ ngân hàng câu hỏi cộng đồng.", stepCertDesc: "Hoàn thành bài đánh giá để mở chứng chỉ gắn với Discord.", discordIdentityText: "Danh tính Discord đã xác minh được dùng cho lượt kiểm tra và chứng chỉ.", quizStartError: "Không thể bắt đầu bài kiểm tra", quizPreparingText: "Đang chuẩn bị 15 câu hỏi ngẫu nhiên từ máy chủ.", loadingVerified: "Đang tải kết quả đã xác minh…",
    startLearning: "Bắt đầu học", previewModule: "Xem nội dung học", exploreEcosystem: "Khám phá hệ sinh thái",
    howItWorks: "Cách hoạt động", stepLearn: "Học tập", stepQuiz: "Làm bài kiểm tra", stepCertificate: "Nhận chứng chỉ",
    learnTitle: "Kiến thức nền tảng QMS", learnIntro: "Khám phá từng chủ đề để hiểu cách QMS hoạt động.",
    lessonContentEnglish: "Nội dung bài học hiện đang được trình bày bằng tiếng Anh.", quizQuestionsEnglish: "Câu hỏi và lựa chọn trả lời hiện đang bằng tiếng Anh.",
    quizTitle: "Bài kiểm tra kiến thức QMS", question: "Câu", of: "/", previous: "Quay lại", next: "Tiếp theo",
    submitQuiz: "Nộp bài", createDemoCertificate: "Tạo chứng chỉ demo", verifying: "Đang chấm…", preparing: "Đang chuẩn bị bài kiểm tra…", loading: "Đang tải…",
    discordRequired: "Yêu cầu Discord", connectBeforeQuiz: "Hãy kết nối Discord trước khi làm bài kiểm tra.",
    serverVerified: "Đã xác minh trên máy chủ", congratulations: "Chúc mừng — bạn đã đạt.",
    notYet: "Bạn chưa đạt lần này.", passedCopy: "Chứng chỉ hoàn thành QMS Academy đã được mở khóa.",
    need12: "Bạn cần trả lời đúng ít nhất 12 câu. Hãy ôn tập và thử lại.",
    dailyBest: "Điểm cao nhất hôm nay của tài khoản Discord:", certificateId: "Mã chứng chỉ:",
    viewCertificate: "Xem chứng chỉ", tryAgain: "Làm bộ câu hỏi ngẫu nhiên khác", reviewModule: "Ôn tập bài học",
    dailyLeaderboard: "Bảng xếp hạng hôm nay", answerAll: "Vui lòng trả lời đủ 15 câu trước khi nộp bài.",
    answersServer: "Mỗi câu có 20 giây. Hết giờ, câu đó được tính là chưa đúng và tự chuyển sang câu tiếp theo. Xếp hạng ưu tiên số câu đúng, sau đó mới cộng điểm thưởng thời gian có giới hạn.",
    noCertificate: "Bạn chưa có chứng chỉ.", certificatePrompt: "Kết nối Discord và hoàn thành bài kiểm tra kiến thức QMS để mở khóa chứng chỉ.",
    goQuiz: "Đến bài kiểm tra", todayResults: "Kết quả tốt nhất hôm nay", takeQuiz: "Làm bài kiểm tra",
    noResults: "Hôm nay chưa có kết quả nào. Hãy là người đầu tiên tham gia.",
    rank: "Hạng", discord: "Discord", bestScore: "Điểm cao nhất", time: "Thời gian",
    leaderboardNote: "Bảng xếp hạng chỉ tính kết quả thật được máy chủ xác minh. Chứng chỉ demo không được tính.",
    ecosystemTitle: "Khám phá hệ sinh thái QMS", ecosystemIntro: "Các tài nguyên và công cụ testnet chính thức của QMS. Luôn kiểm tra liên kết trước khi kết nối ví.",
    officialWebsite: "Trang web chính thức", docs: "Tài liệu", whitepaper: "Sách trắng", testnetGuide: "Hướng dẫn testnet",
    faucet: "Vòi nhận token testnet", status: "Trạng thái mạng", explorer: "Trình khám phá blockchain", qwap: "Sàn QWAP testnet",
    discordLink: "Cộng đồng Discord", xLink: "QMS trên X", telegram: "Cập nhật Telegram", builderProgram: "Chương trình Builder",
    demoPass: "DEMO PASS · chỉ dùng xem thử", demoPassCopy: "Chứng chỉ demo tạm thời đã được tạo để bạn xem trước. Đây không phải kết quả học tập đã xác minh.", demoNotRanked: "Kết quả demo không được tính vào bảng xếp hạng thật.", demoCertificate: "Chứng chỉ demo — chỉ dùng để xem thử. Đây không phải kết quả học tập đã xác minh.",
    footer: "Sản phẩm học tập cộng đồng · Không phải chứng chỉ chính thức của QMS.", startQuiz: "Bắt đầu kiểm tra", connectAndStart: "Kết nối Discord và bắt đầu", backHome: "Về trang chủ", readyToTest: "Bạn đã sẵn sàng kiểm tra?", randomSet: "15 câu hỏi ngẫu nhiên từ ngân hàng 60 câu", freshSet: "Không lặp câu hỏi trong cùng một lượt. Mỗi lượt mới sẽ có bộ câu hỏi khác.", backTopics: "Quay lại danh sách chủ đề", keyPoints: "Những điểm cần ghi nhớ", downloadCertificate: "Tải chứng chỉ", preparingPng: "Đang tạo PNG…", shareX: "Chia sẻ lên X", anotherQuiz: "Làm bài kiểm tra khác", home: "Trang chủ", certificateTitle: "Chứng nhận hoàn thành", certifies: "Chứng nhận rằng", completedThe: "đã hoàn thành chương trình", quizName: "Học tập và Kiểm tra kiến thức QMS", understoodQms: "và thể hiện sự hiểu biết về các khái niệm cốt lõi của QMS.", quizScore: "Điểm kiểm tra", completionDate: "Ngày hoàn thành", certificateIdLabel: "Mã chứng chỉ", communityDisclaimer: "Chứng nhận học tập cộng đồng — không phải chứng chỉ chính thức.", previewCreated: "Bản xem trước dành cho", previewNotCompletion: "Bản xem trước này không xác nhận bạn đã hoàn thành bài đánh giá.", demoDevelopmentPreview: "Bản xem trước trong quá trình phát triển", downloadHint: "Tải chứng chỉ trước, sau đó đính kèm ảnh PNG khi đăng lên X."
  }
};

const SettingsContext = createContext<AppSettings | null>(null);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [settingsReady, setSettingsReady] = useState(false);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("qms-academy-locale");
    const savedTheme = window.localStorage.getItem("qms-academy-theme");
    if (savedLocale === "vi" || savedLocale === "en") setLocaleState(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") setThemeState(savedTheme);
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("qms-academy-locale", locale);
    window.localStorage.setItem("qms-academy-theme", theme);
  }, [locale, theme, settingsReady]);

  const value = useMemo<AppSettings>(() => ({
    locale,
    theme,
    setLocale: setLocaleState,
    toggleTheme: () => setThemeState((current) => current === "dark" ? "light" : "dark"),
    t: (key) => translations[locale][key] ?? translations.en[key] ?? key
  }), [locale, theme]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useAppSettings must be used inside AppSettingsProvider.");
  return context;
}
