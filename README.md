# The Three Oracles

A private, phone-first conversational toy for Bruce, Kevin, and Travis. Ask one question and receive three short, personality-grounded takes plus a group reading—or use Great Questions to bring a genuinely interesting question before the Oracles.

## Architecture

- React 19, TypeScript, Vite, and hand-built responsive CSS
- Vercel functions in `api/`; no database, analytics, accounts, or server-side persistence
- Official OpenAI JavaScript SDK with the Responses API and Zod Structured Outputs
- Shared typed request/response contracts and an installable PWA shell
- Original project-local Central Oregon dusk and storm illustrations in `public/scenery/`

`api/oracle.ts` supports `answer_question` (one request produces all three answers) and `generate_discussion_question` (one request produces one prompt). `api/auth.ts` checks private access. The browser never receives the OpenAI key or authoritative configured access code.

## Local setup

Use Node.js 20 or newer:

```powershell
npm install
Copy-Item .env.example .env.local
npx vercel dev
```

Vercel dev serves both Vite and `/api`. For UI work without credentials, `VITE_ORACLE_MOCK_MODE=true npm run dev` enables a development-only mock seam; it is disabled in production builds.

## Environment variables

```text
OPENAI_API_KEY=your OpenAI project API key
OPENAI_MODEL=gpt-5.6-luna
ORACLE_ACCESS_CODE=a private shared code
```

The model is configured once in `api/_lib/oracleService.ts`; change `OPENAI_MODEL` without touching source. Never prefix secrets with `VITE_`. `.env.local` and equivalent secret files are ignored.

## Profiles and prompting

Factual details, reasoning style, AI behavior, flavor, worldview care, humor boundaries, and the explicit rule against manufactured disagreement live in `src/config/oracleProfiles.ts`. Prompt assembly lives separately in `api/_lib/prompts.ts`.

## Privacy, storage, and cost

The server checks the shared code on every AI call. The browser remembers the entered code for convenience until Sign Out; this is a lightweight privacy gate, not high-security identity. Use HTTPS and a nontrivial code.

`localStorage` contains only access state, selected category, and at most 75 generated questions. Only the latest 20 questions go to the AI for repeat avoidance. Settings clears history or forgets access. The server stores nothing.

Costs stay small through one bounded request per action, a cost-sensitive configurable model, short schemas, output caps, limited history, and duplicate-request locks.

Ask runs use a controlled `DODGE_PROBABILITY` of 0.25. Server logic chooses either all substantive answers or exactly one playful dodge before the single model request; the resulting structured response is verified against that plan.

## Quality commands

```powershell
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

## Vercel deployment

1. Push the reviewed repository to a Git host.
2. In Vercel choose **Add New → Project**, import it, and keep detected Vite settings.
3. Add `OPENAI_API_KEY`, `OPENAI_MODEL`, and `ORACLE_ACCESS_CODE` under **Project Settings → Environment Variables** for Production (and Preview if desired).
4. Deploy, open the URL, enter the shared code, and test both core flows.
5. Install the PWA from the phone browser's install/share menu.

No database, storage provider, analytics service, or scheduled job needs configuration.
