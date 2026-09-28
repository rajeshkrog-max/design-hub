# Sera Interview Arena: repo status

Repo `rajeshkrog-max/design-hub`, branch `main`, last commit `dccf7b0` ("Implemented round-2 schema fixes"), 28 Sep 2026.
Built by Lovable in two rounds. Lovable credits are now used up, so all further work happens in Claude Code.

This report comes from reading the code. The app has **not been built or run** yet, so there has been no type check and no browser test.

## Stack

TanStack Start (React 19, TypeScript, Vite 8), Tailwind v4 with shadcn/ui, Recharts and lucide-react icons.
It is **front end only**. There is no Supabase, no API keys, and no backend. The data lives in an in-memory store saved to `localStorage`, under the key `sera-store-v2`.

## Folder map

```
src/
  routes/            index, login, student-login, institute-login, invite, candidate, institute
  components/
    PublicSite.tsx   landing page
    auth/            login choice, student/institute login with "Sign in as" demo picker, invite
    shared/          Surface, Pill, ProgressBar, ScoreRing, SeraMark
    candidate/       CandidateApp + home/, profile/, interview/ (InterviewTab, AptitudePanel), reports/, resources/
    institute/       InstituteApp + overview/, students/, student-detail/, batches/, analytics/, settings/
    reports/         individual-report/IndividualReportView, batch-report/BatchReportView
    ui/              shadcn primitives
  data/mock/         one file per table + store.ts (localStorage store, resetStore, subscribeStore)
  services/          session.tsx (SessionProvider), student.ts, institute.ts, all tenant-scoped
  lib/rules.ts       all business rules
  types/arena.ts     types matching the 17-table data contract
  styles.css         clay tokens, round colours, light/dark, orb animation
```

## What's done and working in code

- **Data contract.** The types in `types/arena.ts` match the 17 tables. There is one mock file per table: 2 institutes, 4 staff, 3 batches and 25 students, with profiles, sessions, rounds, aptitude attempts, offers, reports, gap diagnoses, resources, restart requests, consents and the audit log.
- **Session and tenant isolation.**
  - `SessionProvider` and a "Sign in as" picker on the login pages.
  - Every service takes the user and filters by `student_id` or `institute_id`.
  - Candidate, institute, student detail and report screens show "You don't have access" when that doesn't match.
- **Rules (`lib/rules.ts`), all implemented:**
  - Profile strength is weighted by section, and tier and `canStartInterview` follow from it.
  - `roundStatus` enforces the strict round order.
  - `canRetry` allows try 2, whose score replaces try 1; `canResume` allows one resume.
  - `currentAverage` and `ceoUnlocked` use the institute threshold.
  - `stuck`, `reportsUnlocked`, `canRequestRestart` and `canPrintCv` are all there.
- **Student services:**
  - profile: `getMyProfile`, `saveProfileSection`, `markCvUploaded`;
  - session and companies: `getMySession`, `getCompanyOptions`, `chooseCompany`;
  - rounds: `startRound`, `endRound`, `recordDisconnect`, `resumeRound`, `retryRound`, `submitAptitude`;
  - outcome: `decideOffer`, `requestRestart`, `getMyReport`, `getMyResources`, `logAudit`.
- **Institute services:**
  - overview and students: `getInstituteOverview`, `listStudents` (with filters), `getStudentDetail`, `decideRestart`;
  - reports and exports: `getBatchReport`, `getIndividualReport`, `exportStudentsCsv`;
  - batches and settings: `addRosterRows`, `getAnalytics`, `getSettings`, `listBatches`.
- **Candidate screens:**
  - a CV file-upload input;
  - a profile editor per section;
  - a company picker;
  - a live round with a real countdown and a "Simulate disconnect" button;
  - resume and retry buttons wired to the services;
  - aptitude with 8 MCQs and 2 written questions;
  - the offer screen;
  - reports with CV templates and `window.print`;
  - resources.
- **Institute screens:** overview, students table, student detail, batches with CSV roster upload, analytics, and settings (viewers are read-only).
- **Reports.** The individual report has 8 page components and the batch report has 10. Both have a print button.

## Gaps and regressions to fix (priority order)

1. **Not verified.** Run install, the type check, lint and the build, and fix any errors. None has run yet.
2. **Candidate layout drifted from the agreed design:**
   - A separate **Profile** tab was added. The agreed design keeps the profile inside **Home**: welcome, CV folder, profile strength card and profile rows. Merge it back and keep four tabs: Home, Interview, Reports, Resources.
   - The header lost the **SERA INTERVIEW ARENA** wordmark (it's now `compact`) and the **Progress status %** pill (it's now the student's name).
   - The Interview tab lost the **left "Round reports" panel**, which syncs live and shows each round's score, verdict and takeaway once it ends, and the **"Your attempts"** card (retries left, resume left, full restart needs institute).
   - The Interview tab also lost the **stage stepper** inside each round and the **microphone and connection pre-check**. Restore them.
3. **Design mode is gone.** Bring back a development-only floating panel in both the candidate and institute apps:
   - a switch that bypasses locks visually;
   - a "jump to state" option that signs in as the mock student in that state;
   - a **Reset demo data** button using `resetStore()`.

   It must never change `rules.ts`.
4. **No print stylesheet.** Add `@media print` rules: A4 size, page breaks between report pages, hide the app chrome, keep backgrounds, and put page numbers in the footer. Apply them to the CV and to both institute reports.
5. **The individual report has 8 of the 11 sections.** Check it against the spec and add the missing ones. The likely missing ones are the aptitude breakdown, communication metrics, and the attempt history and trend.
6. **Print CV lives in Reports.** It should be reachable from **Home** (locked until the offer is accepted) and open the CV preview with 3 templates.
7. **Written aptitude answers.** Check that they are saved and appear in the round result and the reports.
8. **README and roadmap.** `README.md` still has Lovable boilerplate, and none of the items in `roadmap.md` are ticked. Rewrite both.
9. **Leftover code.** Remove anything left from round 1, and check that `routeTree.gen.ts` regenerates cleanly.

## Not started (later, with the user)

- The real database: `docs/schema.sql` (17 tables with row-level security) goes to Supabase **only when the user says so**.
- Voice interviews (Retell or Tavus), the AI that writes Sera's prompts and scores rounds, company and job description generation from the web, server-side PDF generation, and email invites.
