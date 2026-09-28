# Sera Interview Arena: handoff

Last updated: 28 Sep 2026, 18:04 IST

## Product
Interview practice arena by YZI Works. A candidate goes through four simulated rounds against one target company and gets an evidence-based readiness report.
Institutes (placement cells) see their own students' progress and reports.

## Stack and how to run
TanStack Start (React 19, TypeScript, Vite 8), Tailwind v4, shadcn/ui, lucide-react.
- Install: `npm install` (Lovable uses `bun.lock`; `package-lock.json` is gitignored)
- Dev: `npm run dev`, then open http://localhost:8080
- Checks: `npx tsc --noEmit` and `npm run build` must both pass with 0 errors

## Current state
- Front end only. There is no backend, database or API key.
- Typed mock data lives in `src/data/mock`, in an in-memory store saved to localStorage (`sera-store-v4`).
- `src/types/arena.ts` is the data contract, and `docs/schema.sql` matches it.
- Every data call goes through `src/services`. `src/services/auth.ts` holds the backend stubs, each marked `// TODO backend` with a mock return.

## Done so far
- Lovable rounds 1–2, up to `dccf7b0`: the base app, mock data, services, and the candidate and institute screens.
- Phase A, `9f8d82e`: compile fixes, removed the round-1 mock, added CLAUDE.md and docs.
- Phase B1, `3cbe2a7`: simple login screens, account types, credits and plans, auth stubs.
- Landing, `9040571`: a single "Sign in" entry in the top nav.
- Phase B2, `9aaf40f`: candidate redesign to the mock (sidebar, top bar, dashboard, interview, reports, resources, profile), with "functional" renamed to "aptitude".

## Business rules (all in `src/lib/rules.ts`)
- Round order: screening (5 min voice) → aptitude (15 MCQs, 20 min) → hr_bp (5 min voice) → ceo (5 min voice). A round opens only when the one before it has passed.
- Pass bar: 60, per round (`institutes.pass_bar`).
- CEO: never opens on its own. The "Unlock CEO round" button in the HR BP result panel is enabled when HR BP is done and the average of screening, aptitude and HR BP is at least 65 (`canUnlockCeo`, `unlockCeo`).
- Retry: a failed round gets one retry, and try 2's score replaces try 1.
- Resume: one resume after a disconnect. A second disconnect marks the round incomplete.
- Restart: institute students can ask their institute for a full restart once the attempt is finished or stuck. An institute admin approves it.
- Credits and plans: institute students see "Interview credits: X of Y" (3 from the institute deal) and never see prices. Independents see their plan name: Standard ₹499 (3 credits) or Pro ₹999 (8 credits).
- Credits are not yet spent when an attempt starts. There is no subscription logic yet.

## Login model (UI only; any input continues)
- Institute student: institute code + WhatsApp number → OTP (any 6 digits). Sign-up adds name and email.
- Independent candidate: email + WhatsApp number → OTP. Sign-up adds name, then the plan page (`/plans`).
- Institute: one login per institute (email + password), and it sees only that institute's students.
- Demo: Riya Kulkarni (Pioneer, mid-journey), Aarav Sharma (independent, Standard), and the Pioneer institute login.

## Design
- `docs/sera-dashboard-mock.html` is the approved look: white-grey clay, green accents, black text, no pink.
- Its tokens (`--bg`, `--panel`, `--ink`, `--raise`, `--inset`…) are in `src/styles.css`, with light and dark modes. The candidate app toggles dark mode with `html[data-theme]`.

## Known gaps / next steps
- The landing page (`src/components/PublicSite.tsx`) still lists "Functional" and the old round order.
- The institute app needs a redesign to the new look. It only picked up the new colours.
- Reports PDF/print: there is no `@media print` stylesheet yet, so the print and PDF buttons use a plain `window.print()`.
- Backend wiring is for the backend teammate. It means replacing the `// TODO backend` stubs and mock services, and applying `docs/schema.sql` (not run yet, and only when the user says so).
- Credit spending, subscriptions and payments are not built.

## Rules for any AI picking this up (from CLAUDE.md)
- Front end only. No Supabase, database or API keys. Never run `docs/schema.sql`.
- All business rules live in `src/lib/rules.ts`.
- Services always filter by student or `institute_id`.
- Keep the claymorphism design.
- No force-push or amend. Push only when the user says "push".
- Ask before adding dependencies.
