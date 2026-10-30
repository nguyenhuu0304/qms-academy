"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useAppSettings } from "@/components/AppSettingsProvider";

type LessonTopic = {
  id: string;
  number: string;
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    paragraphs?: string[];
    bullets?: string[];
  }>;
  keyPoints: string[];
};

const topics: LessonTopic[] = [
  {
    id: "qms-overview",
    number: "01",
    title: "What QMS is",
    summary: "Start with the big picture: what QMS is trying to build and why the network combines post-quantum design, EVM compatibility and useful computation.",
    sections: [
      {
        heading: "A Layer-1 built for a different future",
        paragraphs: [
          "QMS, short for Quantum Monetary System, is a Layer-1 blockchain designed around the idea that blockchain infrastructure should be prepared for the post-quantum era rather than waiting for quantum computing to become an emergency.",
          "The network is being developed as an EVM-compatible chain, so developers can interact with it using familiar Ethereum-style wallets, smart contracts and developer tooling while QMS develops its own consensus and useful-computation model."
        ]
      },
      {
        heading: "Three ideas to keep in mind",
        bullets: [
          "Post-quantum direction: QMS separates protocol layers so security can evolve without pretending every component is already post-quantum today.",
          "Proof of Useful Work: mining computation is intended to solve optimization problems rather than exist only as disposable hash work.",
          "EVM compatibility: builders can start with familiar tools instead of learning an entirely new execution environment from zero."
        ]
      },
      {
        heading: "Why the public testnet matters",
        paragraphs: [
          "The current testnet is an early environment for testing the chain, smart contracts, RPC behavior, the explorer, QWAP and the wider developer experience. Testnet activity is experimental: balances and history can be reset, and test tokens have no monetary value.",
          "For learners, this is useful because QMS can be studied at two levels at the same time: the long-term architecture described by the project and the parts that can already be tested today."
        ]
      }
    ],
    keyPoints: [
      "QMS is a Layer-1 blockchain.",
      "It is designed for the post-quantum era.",
      "The current testnet is EVM-compatible.",
      "The project combines blockchain security with useful computation."
    ]
  },
  {
    id: "pouw",
    number: "02",
    title: "Proof of Useful Work",
    summary: "Learn how QMS wants mining work to solve optimization problems, how work is verified and how miners may eventually earn from both the network and clients.",
    sections: [
      {
        heading: "From mining work to useful work",
        paragraphs: [
          "Proof of Useful Work, or PoUW, is one of the central ideas behind QMS. Instead of treating mining computation as work whose only purpose is to secure the chain, QMS aims to direct that computation toward optimization problems with value outside block production.",
          "Examples discussed by QMS include portfolio optimization, vehicle routing and scheduling. These are problems where many possible choices exist and the goal is to find a high-quality solution under defined constraints."
        ]
      },
      {
        heading: "QUBO and optimization",
        paragraphs: [
          "QMS initially focuses on QUBO-style problems. QUBO stands for Quadratic Unconstrained Binary Optimization. In simple terms, a problem is expressed using binary decisions and an objective function that scores the quality of a candidate solution.",
          "This format is useful because a client can describe what should be optimized while the network can compare candidate solutions using measurable criteria."
        ]
      },
      {
        heading: "How the current testnet works",
        bullets: [
          "The first testnet uses network-generated optimization problems rather than real client-submitted jobs.",
          "The QMS team currently runs the miners in the early testnet phase.",
          "Work is broken into smaller computation chunks, with hashes produced between chunks.",
          "When a hash wins, the relevant computation can be re-run so the network does not need to repeat every unit of work from every miner."
        ]
      },
      {
        heading: "Why precomputation must be prevented",
        paragraphs: [
          "A useful-work system would be unfair if miners could calculate future jobs in advance. QMS therefore links work to randomness from the previous block so the relevant computation cannot simply be prepared long before the mining round begins."
        ]
      },
      {
        heading: "The future marketplace",
        paragraphs: [
          "The longer-term plan is to allow clients to submit useful optimization jobs and fund rewards for valid solutions. A client can define what a good solution means, and miners can compete to solve that job.",
          "This creates the possibility of two miner revenue streams: the normal network block reward and a separate payment from a client for useful computation. QMS presents this as a way to connect blockchain security economics with demand for real computation."
        ]
      },
      {
        heading: "Block reward vs solution quality",
        paragraphs: [
          "It is important not to mix two separate ideas. A miner can perform useful computation, but QMS describes block-reward selection as lottery-based rather than simply giving the block to whoever finds the highest-quality optimization result. The useful solution and the chain's block-selection mechanism therefore have distinct roles."
        ]
      },
      {
        heading: "Classical and quantum hardware",
        paragraphs: [
          "Useful work on QMS is not limited to quantum computers. Classical solvers can perform these optimization tasks today. The architecture is intended to accommodate increasingly capable computing hardware over time rather than requiring quantum hardware for current participation."
        ]
      }
    ],
    keyPoints: [
      "PoUW means Proof of Useful Work.",
      "QMS focuses on useful optimization problems.",
      "The current testnet uses network-generated jobs.",
      "QUBO is an important problem format in the QMS model.",
      "Future miners may earn block rewards plus client payments.",
      "Useful work can be performed with classical hardware today."
    ]
  },
  {
    id: "post-quantum",
    number: "03",
    title: "Post-quantum direction",
    summary: "Understand what quantum computing threatens, which QMS layers are designed differently and why migration is more complicated than changing one signature algorithm.",
    sections: [
      {
        heading: "Where the quantum threat appears",
        paragraphs: [
          "For blockchains, a major concern is public-key cryptography used for digital signatures. A sufficiently capable quantum computer could threaten signature systems that many current blockchain accounts depend on.",
          "QMS distinguishes this signature problem from hashing. Hash functions are also affected by quantum advances, but they are generally considered more resilient than public-key signatures under the same type of threat."
        ]
      },
      {
        heading: "QMS does not claim everything is already post-quantum",
        paragraphs: [
          "A useful distinction in the QMS design is between being built for the post-quantum era and claiming that every wallet, transaction and execution-layer component already uses post-quantum signatures today.",
          "The current public testnet keeps Ethereum-style execution compatibility so existing wallets and developer tools can work. Post-quantum wallet signing is not presented as a feature of the current v0.1 testnet."
        ]
      },
      {
        heading: "Block production",
        paragraphs: [
          "QMS describes block production as not depending on public-key signatures. This matters because a protocol layer that does not rely on those signatures does not face the same future signature-migration problem as a chain whose block production directly depends on them."
        ]
      },
      {
        heading: "Finality and execution are separate concerns",
        bullets: [
          "Finality is designed with the post-quantum direction in mind.",
          "The execution layer currently preserves EVM and Ethereum-style compatibility.",
          "The execution layer can migrate toward post-quantum signatures over time.",
          "QMS has discussed using a precompile to make post-quantum signature verification cheaper inside smart contracts."
        ]
      },
      {
        heading: "Why migration is hard for established chains",
        paragraphs: [
          "Changing a signature scheme is not only a core-protocol problem. Wallets, bridges, custody providers, applications and other surrounding infrastructure may also need to understand and support the new cryptography.",
          "QMS argues that starting with a new architecture gives it more freedom to design protocol layers around future security requirements instead of retrofitting every layer later."
        ]
      },
      {
        heading: "The cost of post-quantum signatures",
        paragraphs: [
          "Post-quantum signature schemes can be substantially larger and may require more work to verify than signatures commonly used by blockchains today. This creates practical questions around bandwidth, storage, execution cost and throughput, which is why migration design matters as much as the cryptography itself."
        ]
      }
    ],
    keyPoints: [
      "Quantum computing primarily threatens current digital-signature systems.",
      "QMS separates block production, finality and execution concerns.",
      "The current execution layer remains Ethereum-compatible.",
      "Post-quantum wallet signing is not yet part of the current public testnet.",
      "Migration also affects wallets, bridges, custody and applications."
    ]
  },
  {
    id: "evm-builders",
    number: "04",
    title: "EVM & builder experience",
    summary: "See why EVM compatibility matters for QMS and what familiar Ethereum tools can be used when building and debugging on the testnet.",
    sections: [
      {
        heading: "Why EVM compatibility matters",
        paragraphs: [
          "A new Layer-1 can have an interesting consensus design, but developers still need a practical way to build applications. QMS uses EVM compatibility to reduce that barrier.",
          "That means developers can approach QMS using many of the same concepts they already know from Ethereum: Solidity contracts, Ethereum-style accounts, JSON-RPC calls and familiar development frameworks."
        ]
      },
      {
        heading: "Smart contracts",
        paragraphs: [
          "Developers can deploy EVM smart contracts on the QMS testnet. Existing Ethereum contracts may be portable with little or no execution-layer redesign, although every application should still be tested against QMS-specific network behavior before assuming perfect compatibility."
        ]
      },
      {
        heading: "Common tools",
        bullets: [
          "Solidity for smart-contract development.",
          "Foundry for building, deploying, testing and tracing contract execution.",
          "Hardhat as another familiar Ethereum development framework.",
          "ethers.js for JavaScript and TypeScript applications that need to communicate with contracts and wallets.",
          "Ethereum-compatible wallets for interacting with the testnet."
        ]
      },
      {
        heading: "RPC: the bridge between apps and the chain",
        paragraphs: [
          "An RPC endpoint is how wallets, scripts and dApps ask the blockchain for information or submit transactions. It is a core part of the developer experience because even a correct smart contract is difficult to work with if RPC behavior is unreliable or inconsistent."
        ]
      },
      {
        heading: "Explorer and debugging",
        paragraphs: [
          "A block explorer helps builders inspect transaction status, methods, addresses, blocks, token transfers and contract interactions. When a transaction fails, deeper tooling such as Foundry can help inspect the execution path instead of relying only on a generic Failed label.",
          "This is why developer experience is more than contract compatibility. RPC reliability, gas estimation, trace availability, explorer decoding and contract verification all influence how quickly a builder can understand and fix a problem."
        ]
      }
    ],
    keyPoints: [
      "QMS Testnet supports the EVM.",
      "Solidity contracts can be deployed on the testnet.",
      "Foundry, Hardhat and ethers.js are relevant tools for builders.",
      "RPC connects wallets and applications to the blockchain.",
      "Good explorer and debugging support make building easier."
    ]
  },
  {
    id: "testnet-qwap",
    number: "05",
    title: "Testnet & QWAP",
    summary: "Learn the practical testnet details: network configuration, faucet, test assets, resets, safety guidance and what QWAP is used for.",
    sections: [
      {
        heading: "QMS Testnet network details",
        bullets: [
          "Chain ID: 19480.",
          "Native currency symbol: QMS.",
          "RPC endpoint: https://rpc.testnet.qms.finance.",
          "The network is a test environment, not mainnet."
        ]
      },
      {
        heading: "Faucet and test assets",
        paragraphs: [
          "The faucet provides free test QMS so users can pay testnet transaction fees and experiment with the ecosystem. The project has also referenced test versions of assets such as USDC, USDT, WETH and WBTC for QWAP testing.",
          "These are test tokens. They have no monetary value and should not be treated as real investment assets."
        ]
      },
      {
        heading: "Testnet resets",
        paragraphs: [
          "Because this is an early test network, QMS can reset the chain as development progresses. A reset can remove test balances, transaction history and liquidity positions. Testnet activity should therefore be treated as temporary experimental data rather than permanent financial state."
        ]
      },
      {
        heading: "Wallet safety",
        paragraphs: [
          "Using a separate wallet account for testnet experimentation is a sensible safety practice. QMS also states that the team will never ask users to provide a seed phrase or private key. Those credentials should never be shared with a website, moderator, support account or community member."
        ]
      },
      {
        heading: "What QWAP is",
        paragraphs: [
          "QWAP is an independent decentralized exchange built on the QMS network. It provides a practical environment where testnet users can perform swaps and provide liquidity while the broader QMS ecosystem is being tested.",
          "Because it is a test environment, displayed APRs or other economic figures should not be interpreted as guaranteed real-world returns."
        ]
      },
      {
        heading: "Why testnet feedback matters",
        paragraphs: [
          "Public testing exposes behavior that is difficult to reproduce in a closed environment. Faucet load, RPC reliability, explorer behavior, transaction failures and dApp UX can all surface when many independent users start interacting with the network.",
          "QMS has already used public testnet feedback to adjust infrastructure, including adding anti-bot protection after heavy faucet activity."
        ]
      }
    ],
    keyPoints: [
      "Chain ID is 19480.",
      "The native testnet symbol is QMS.",
      "Test tokens have no monetary value.",
      "Testnet resets can remove balances and history.",
      "QWAP is an independent DEX for test swaps and liquidity.",
      "Never share a seed phrase or private key."
    ]
  },
  {
    id: "roadmap-marketplace",
    number: "06",
    title: "Roadmap & useful-work marketplace",
    summary: "Finish with the direction QMS has described for external miners, marketplace jobs, portfolio optimization and the next stages of protocol development.",
    sections: [
      {
        heading: "Opening mining",
        paragraphs: [
          "The earliest QMS testnet phase is operated with miners run by the QMS team. A major future step is to open mining to outside participants so the useful-work network can become more decentralized."
        ]
      },
      {
        heading: "Before broader mining",
        paragraphs: [
          "QMS has identified protocol areas such as finalization, difficulty adjustment and tokenomics as important work for later blockchain versions. These pieces affect how an open mining network remains secure and economically sustainable."
        ]
      },
      {
        heading: "Marketplace preview",
        paragraphs: [
          "Before a full useful-work marketplace is mature, QMS has discussed a marketplace preview. The basic model is that clients can submit optimization problems, define evaluation criteria and fund rewards for solutions."
        ]
      },
      {
        heading: "Portfolio optimization",
        paragraphs: [
          "Portfolio optimization has been discussed as an early marketplace use case. The general problem is to choose among possible allocations while balancing objectives and constraints. It fits the broader QUBO-oriented optimization model described by QMS."
        ]
      },
      {
        heading: "Other real-world optimization categories",
        bullets: [
          "Vehicle routing: deciding efficient routes across many destinations and constraints.",
          "Scheduling: assigning people, machines or tasks across limited time and resources.",
          "Resource allocation: selecting how limited capacity should be distributed among competing needs."
        ]
      },
      {
        heading: "The larger economic idea",
        paragraphs: [
          "The long-term QMS vision is broader than a blockchain that simply executes transactions. The useful-work model is intended to create a decentralized compute marketplace where clients pay for optimization results and miners earn for providing computation while also participating in network security.",
          "Whether that model can scale depends on practical questions such as demand for jobs, solution verification, miner incentives and protocol performance. Those are exactly the kinds of questions an early testnet and future marketplace releases are intended to explore."
        ]
      }
    ],
    keyPoints: [
      "External mining is planned for a later stage.",
      "Finalization, difficulty adjustment and tokenomics are roadmap priorities.",
      "A useful-work marketplace is part of the longer-term plan.",
      "Portfolio optimization is an early marketplace use case discussed by QMS.",
      "Clients define useful jobs and can fund rewards for solutions."
    ]
  }
];

export default function LearnPage() {
  const { status } = useSession();
  const { t, locale } = useAppSettings();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("qms-academy-completed-topics") || "[]");
      if (Array.isArray(saved)) setCompletedTopics(saved.filter((id): id is string => typeof id === "string" && topics.some((topic) => topic.id === id)));
    } catch { /* Ignore malformed local progress and start clean. */ }
  }, []);
  function toggleTopicCompletion(topicId: string) {
    setCompletedTopics((previous) => {
      const next = previous.includes(topicId) ? previous.filter((id) => id !== topicId) : [...previous, topicId];
      window.localStorage.setItem("qms-academy-completed-topics", JSON.stringify(next));
      return next;
    });
  }
  const progressPercent = topics.length ? Math.round((completedTopics.length / topics.length) * 100) : 0;
  const topicTitlesVi: Record<string, string> = { "qms-overview": "QMS là gì?", "pouw": "Proof of Useful Work", "post-quantum": "Định hướng hậu lượng tử", "evm-builders": "EVM và trải nghiệm builder", "testnet-qwap": "Testnet và QWAP", "roadmap-marketplace": "Lộ trình QMS" };
  const selectedTopic = topics.find((topic) => topic.id === activeTopic) ?? null;

  return (
    <main className="learn-shell">
      <div className="container">
        {!selectedTopic ? (
          <>
            <div className="module-header">
              <div>
                <div className="eyebrow">Module 1 · QMS Fundamentals</div>
                <h1 className="learn-title">{t("learnTitle")}</h1>
                <p className="lead">
                  {t("learnIntro")}
                </p>
              </div>
            </div>

            <section className="learning-progress" aria-label={locale === "vi" ? "Tiến độ học tập" : "Learning progress"}>
              <div className="learning-progress-head"><strong>{locale === "vi" ? "Tiến độ học tập" : "Learning progress"}</strong><span>{completedTopics.length}/{topics.length} {locale === "vi" ? "chủ đề hoàn thành" : "topics completed"}</span></div>
              <div className="progress" role="progressbar" aria-valuenow={completedTopics.length} aria-valuemin={0} aria-valuemax={topics.length} aria-label={`${completedTopics.length} of ${topics.length} topics completed`}><div style={{ width: `${progressPercent}%` }} /></div>
            </section>
            {locale === "vi" ? <p className="helper-copy">{t("lessonContentEnglish")}</p> : null}
            <div className="topic-grid">
              {topics.map((topic) => (
                <button
                  type="button"
                  className="topic-card"
                  key={topic.id}
                  onClick={() => {
                    setActiveTopic(topic.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="topic-number">{topic.number}</span>
                  <span className="topic-content">
                    <strong>{locale === "vi" ? (topicTitlesVi[topic.id] ?? topic.title) : topic.title}</strong>
                    <span>{topic.summary}</span>
                    {completedTopics.includes(topic.id) ? <span className="topic-complete">✓ {locale === "vi" ? "Đã hoàn thành" : "Completed"}</span> : null}
                  </span>
                  <span className="topic-arrow" aria-hidden="true">→</span>
                </button>
              ))}
            </div>

            <article className="quiz-entry-card">
              <div>
                <div className="eyebrow">{t("readyToTest")}</div>
                <h2>{t("randomSet")}</h2>
                <p>{t("freshSet")}</p>
              </div>
              <div className="hero-actions" style={{ marginTop: 0 }}>
                {status === "authenticated" ? (
                  <Link href="/quiz" className="btn btn-primary">{t("startQuiz")}</Link>
                ) : (
                  <button className="btn btn-primary" onClick={() => signIn("discord", { callbackUrl: "/quiz" })}>
                    {t("connectAndStart")}
                  </button>
                )}
                <Link href="/" className="btn">{t("backHome")}</Link>
              </div>
            </article>
          </>
        ) : (
          <>
            <button
              type="button"
              className="back-to-topics"
              onClick={() => {
                setActiveTopic(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              ← {t("backTopics")}
            </button>

            <article className="lesson-detail">
              <div className="lesson-detail-head">
                <span className="topic-number large">{selectedTopic.number}</span>
                <div>
                  <div className="eyebrow">QMS Fundamentals</div>
                  <h1>{locale === "vi" ? (topicTitlesVi[selectedTopic.id] ?? selectedTopic.title) : selectedTopic.title}</h1>
                  <p className="lead">{selectedTopic.summary}</p>
                  <div className="topic-progress-meta">{topics.findIndex((topic) => topic.id === selectedTopic.id) + 1}/{topics.length} · {completedTopics.includes(selectedTopic.id) ? (locale === "vi" ? "Đã hoàn thành" : "Completed") : (locale === "vi" ? "Chưa hoàn thành" : "Not completed")}</div>
                </div>
              </div>

              <div className="lesson-detail-body">
                {locale === "vi" ? <p className="user-id">{t("lessonContentEnglish")}</p> : null}
                {selectedTopic.sections.map((section) => (
                  <section className="lesson-section" key={section.heading}>
                    <h2>{section.heading}</h2>
                    {section.paragraphs?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets ? (
                      <ul>
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    ) : null}
                  </section>
                ))}

                <aside className="key-points">
                  <div className="eyebrow">{t("keyPoints")}</div>
                  <ul>
                    {selectedTopic.keyPoints.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </aside>
              </div>
            </article>

            <div className="lesson-completion-row">
              <button type="button" className={completedTopics.includes(selectedTopic.id) ? "btn completion-done" : "btn btn-primary"} onClick={() => toggleTopicCompletion(selectedTopic.id)}>
                {completedTopics.includes(selectedTopic.id) ? (locale === "vi" ? "✓ Đã đánh dấu hoàn thành" : "✓ Marked as completed") : (locale === "vi" ? "Đánh dấu đã học xong" : "Mark topic as completed")}
              </button>
              <span className="helper-copy">{locale === "vi" ? "Tiến độ được lưu trên trình duyệt này." : "Progress is saved in this browser."}</span>
            </div>
            <div className="lesson-nav">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const currentIndex = topics.findIndex((topic) => topic.id === selectedTopic.id);
                  const previous = topics[currentIndex - 1];
                  if (previous) {
                    setActiveTopic(previous.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    setActiveTopic(null);
                  }
                }}
              >
                {locale === "vi" ? "Chủ đề trước" : "Previous"}
              </button>

              {topics.findIndex((topic) => topic.id === selectedTopic.id) < topics.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const currentIndex = topics.findIndex((topic) => topic.id === selectedTopic.id);
                    setActiveTopic(topics[currentIndex + 1].id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {locale === "vi" ? "Chủ đề tiếp theo" : "Next topic"}
                </button>
              ) : status === "authenticated" ? (
                <Link href="/quiz" className="btn btn-primary">{t("startQuiz")}</Link>
              ) : (
                <button className="btn btn-primary" onClick={() => signIn("discord", { callbackUrl: "/quiz" })}>
                  {t("connectAndStart")}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
