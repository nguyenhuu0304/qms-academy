# QMS Academy v0.2.1 — bilingual UI, themes and demo certificate preview

QMS Academy is a community learning prototype built with Next.js 14, React, NextAuth, and Discord OAuth. This version preserves the existing learning modules and adds server-verified quiz attempts, verified certificates, a daily leaderboard, English/Vietnamese interface labels, light/dark themes, and an official QMS ecosystem directory.

> The certificate is a community learning certificate, not an official qualification. This app does not issue an NFT or financial reward.

## What's changed

- The 60-question bank and correct answers are only imported by server code. The quiz page receives questions without answer keys.
- `/api/quiz/start` creates a random 15-question attempt on the server. Attempts expire after 30 minutes.
- `/api/quiz/submit` checks the submitted answers on the server and calculates the score there. Each attempt can be submitted only once.
- Passing score remains 12/15. The certificate ID is generated on the server and saved with the verified attempt.
- `/api/certificate` returns the latest verified passing result for the signed-in Discord account; the certificate page no longer trusts `localStorage`.
- `/api/leaderboard` and `/leaderboard` show the best score for each Discord account per day, using Vietnam time (UTC+7).
- The SQL migration enables RLS and denies direct `anon`/`authenticated` table access. Only server routes use the Supabase secret key.
- A temporary local-only demo pass can be enabled with `QMS_DEV_CERTIFICATE_BYPASS=true`. It is ignored in production, labels the certificate as a demo preview, and stores the result under a non-current date so it does not enter the live daily leaderboard. Turn it off after previewing.

## 1. Configure Discord OAuth

In Discord Developer Portal, set the OAuth2 redirect URL to:

`http://localhost:3000/api/auth/callback/discord`

For production, also add the production callback URL. Use the same Discord application values in your local environment and hosting platform.

## 2. Create the Supabase database

1. Create a Supabase project at <https://supabase.com/dashboard>.
2. Open **SQL Editor** in that project.
3. Open `supabase/migrations/202610290001_qms_quiz.sql` from this repository, copy the entire file, paste it into SQL Editor, and run it once.
4. In Supabase **Project Settings → API Keys**, copy the project URL and a server-side secret key. A legacy service-role key is also accepted.
5. Never use the secret/service-role key in browser code, never prefix it with `NEXT_PUBLIC_`, and never paste it into chat or source control.

## 3. Configure local environment

Create `.env.local` in the project root. You can copy `.env.example`, then replace the placeholders with your own values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
DISCORD_CLIENT_ID=your-discord-application-client-id
DISCORD_CLIENT_SECRET=your-discord-application-client-secret
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
QMS_DEV_CERTIFICATE_BYPASS=false
```

For a local certificate preview only, change the last line to `QMS_DEV_CERTIFICATE_BYPASS=true`, restart the dev server, open `/quiz`, then use the `Create demo certificate` button without answering, and open `/certificate`. This option only works when `NODE_ENV` is not `production`. Change it back to `false` after previewing. Never enable a bypass for a public deployment.

Generate a random `NEXTAUTH_SECRET` locally if needed. Do not commit `.env.local`. For deployment, set these variables in the hosting provider's environment-variable settings and redeploy.

## 4. Run the project

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

Then open <http://localhost:3000> and connect Discord. Use the header controls to switch English/Vietnamese and light/dark mode. The navigation and main interface labels are bilingual; lesson explanations and the question bank are still in English in this release. Open `/ecosystem` for official QMS links.

## 5. Manual acceptance test

- Sign in with Discord and open `/quiz`.
- Confirm the quiz has 15 questions and does not show any answer key.
- Answer all 15 questions and submit. The UI should show a server-verified score.
- Confirm 12/15 or higher unlocks the certificate. Open `/certificate`, download the PNG, and check the Discord name, score, date, certificate ID, and disclaimer.
- With the demo flag disabled, try `/certificate` before passing on a fresh account; it should not unlock a certificate.
- With the demo flag enabled locally, complete an attempt and confirm the generated certificate is visibly marked DEMO PREVIEW and does not appear in today's leaderboard.
- Open `/leaderboard`; it should show today's best score per Discord account.
- Submit the same attempt twice using the same attempt ID; the second submission must be rejected.
- Start an attempt, wait until it expires, and confirm it cannot be submitted.
- Sign in with two different Discord accounts and verify they appear as separate leaderboard entries.

## Official QMS ecosystem links

The `/ecosystem` page links to the official website, docs, whitepaper, testnet guide, faucet, status page, explorer, QWAP testnet, Discord, X, Telegram and Builder Program.

## Notes / limitations

- This is a community learning feature. Do not connect it to token rewards or financial payouts without a separate security review and abuse controls.
- The quiz server now keeps the answer key out of the client bundle, but this is not a guarantee against every form of abuse. Production deployments should add rate limiting and monitoring.
- The current daily leaderboard is one row per Discord ID per Vietnam calendar day; only a higher score replaces that day's previous best.
- Existing lesson text and question sourcing should be reviewed against current official QMS documentation before a public launch.


## v0.2.2 timed quiz and ranking update

After applying the original `202610290001_qms_quiz.sql` migration, run `supabase/migrations/202610300001_qms_timed_ranking.sql` once in the Supabase SQL Editor. Each question displays a 20-second countdown; unanswered questions are submitted as incorrect. The server measures total attempt duration from its stored start timestamp. Ranking points are `correct answers × 100 + a capped time bonus (0–99)`, so one additional correct answer always outweighs the maximum speed bonus. Daily ranking sorts by ranking points, correct answers, then shorter duration.

The QMS logo asset used on the certificate is `public/qms-logo.png`; the previous empty `qms-logo-mark.png` placeholder is replaced with a valid copy for compatibility.


## v0.2.3 UI and learning experience update

This release keeps the existing six learning topics, 60-question bank, 15-question randomized quiz, 20-second question timer, 12/15 passing threshold, Discord sign-in and server-side Supabase verification.

### Included
- Shared Light/Dark theme state with a pre-paint theme bootstrap to prevent route-transition theme flashes.
- Separate transparent QMS logo variants for dark and light backgrounds.
- Compact EN / VI segmented control and accessible icon-only theme toggle.
- Themed loading skeletons and stronger text sizing/contrast.
- Server-generated post-submission answer review: selected answer, correct answer, explanation and source. Correct answers are not sent to the browser before a verified submission.
- Local browser-based lesson completion progress for the six topics. This is a learning aid only and does not unlock or bypass the server-verified quiz.
- Leaderboard empty state, current-user highlight, locale-formatted date and rank-points explanation.

### Database migration
No new Supabase migration is required for v0.2.3. The existing v0.2.2 RPC and stored `answers` field are reused. Do not rerun the previous migrations for this UI/learning update.

### Before public deployment
- Keep `.env.local` out of Git.
- Keep `QMS_DEV_CERTIFICATE_BYPASS=false`. The bypass is for local preview only and is ignored in production.
- Confirm Discord OAuth callback URLs use the deployed domain, not `localhost`.
