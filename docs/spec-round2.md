# Lovable fix prompt · Sera Interview Arena (round 2)

Paste everything below the line into Lovable as one message. Lovable pushes to the connected GitHub repo automatically after it finishes.

---

## Hard rules for this round (read first)

- **Front end only.** Do **not** enable Lovable Cloud, and do **not** connect or create a Supabase project, database, tables, auth, storage or edge functions.
- Do **not** create a `supabase/` folder or any SQL or migration files. We will add the real database ourselves later.
- Do **not** add any API keys, environment secrets or paid services.
- If a step seems to need a backend, fake it with the in-memory mock services described below and move on. Never ask to connect a database.
- Everything runs on typed mock data, so we can swap in the real backend later.

---

The look is right, so keep the visual design exactly as it is: the clay styles, round colours, tokens, layouts and copy tone. This round fixes structure, data and behaviour. Do all of the following, in this order, and do not redesign any screen unless a step below asks for it.

## 1. Split the code into proper files

`candidate-app.tsx`, `institute-app.tsx` and `public-site.tsx` are too large, and components are written on single lines. Split them into one component per file, formatted with Prettier:

- `src/components/candidate/` → `home/`, `profile/`, `interview/` (round panel, company picker, pre-check, live interview, aptitude, round result, CEO lock, offer), `reports/`, `resources/`.
- `src/components/institute/` → `overview/`, `students/`, `student-detail/`, `batches/`, `analytics/`, `settings/`.
- `src/components/reports/` → `individual-report/` and `batch-report/`, each with one component per report page.
- Keep the shared pieces (`Surface`, `Pill`, `ProgressBar`, `ScoreRing`, `SeraMark`) in `src/components/shared/`.

No component should render hard-coded copy about a specific student. All content comes from props or hooks.

## 2. Make the schema real

1. **No database work.** Only TypeScript types and mock data. The table list in section 9 is the contract.
2. Rewrite `src/types/arena.ts` so the types match the tables in section 9 one to one: `Institute`, `InstituteUser`, `Batch`, `Student`, `StudentProfile`, `CompanyProfile`, `InterviewSession`, `SessionRound`, `AptitudeAttempt`, `Offer`, `Report`, `GapDiagnosis`, `Resource`, `RestartRequest`, `BatchReport`, `Consent` and `AuditLogEntry`. Use exactly the table and field names listed in section 9, in snake_case.
3. Remove the shortcut fields from `Student` (`demo_state`, `profile_strength`, `current_round`, `last_score`, `verdict`, `weak_area`). Derive those values in the service layer from sessions, rounds and profiles instead.
4. Rebuild `src/data/mock/` as one file per table, holding realistic rows for:
   - 2 institutes, 2 staff users each (1 admin, 1 viewer), 3 batches and 25 students.
   - Every student gets a real profile with different content. Vary the strength: some Starter, some Good, some Strong. Some profiles leave the optional sections blank.
   - At least one student in each state, with real session and round rows behind it:
     - Not started, profile incomplete.
     - Profile done, not interviewed.
     - Mid screening.
     - Passed screening, mid HR BP.
     - Failed functional, retry available.
     - Failed functional, retried and passed.
     - Disconnected once, resume available.
     - Resume used, round incomplete.
     - CEO locked at an average of 64.
     - CEO unlocked, offer pending.
     - Offer accepted.
     - Offer declined.
     - Restart requested and pending.
     - Restart approved.
   - 3 company profiles per student tier, aptitude attempts with 8 MCQs and 2 written questions, gap diagnoses, reports and resources.

## 3. Add a service layer and a session

- Create a `SessionProvider` holding the current user: `{ role: 'student' | 'institute', auth_user_id, student_id?, institute_user_id?, institute_id }`.
- The login pages set this session. Add a small "Sign in as" demo picker on each login page, listing mock students and mock institute staff from **both** institutes, so we can test isolation.
- Every service function in `src/services/` takes the current user and filters strictly:
  - students see only their own rows;
  - institute users see only rows where `institute_id` matches their own.
- Services throw if data from another tenant is requested.
- Suggested services:
  - student side: `getMyProfile`, `saveProfileSection`, `getMySession`, `getCompanyOptions`, `startRound`, `endRound`, `recordDisconnect`, `resumeRound`, `retryRound`, `submitAptitude`, `decideOffer`, `requestRestart`, `getMyReport`;
  - institute side: `getInstituteOverview`, `listStudents` (with filters), `getStudentDetail`, `decideRestart`, `getBatchReport`, `getIndividualReport`, `logAudit`.
- The mock services mutate an in-memory store, persisted to `localStorage`, so actions stick while we click around. Add a "Reset demo data" button in the Design mode panel.
- Add a guard so a student opening another student's id, or an institute user opening another institute's student, sees a "You don't have access" screen.
- Every report view and every download calls `logAudit`.

## 4. Wire every rule from `src/lib/rules.ts`

The UI must only read rule results; it must never decide rules itself. Use or extend these functions:

- `profileStrength(profile)`: a weighted score from the sections that are actually filled; `profileTier(score)`. Saving any section recalculates strength live on Home.
- `canStartInterview(profile)`: the four required sections are complete.
- `roundStatus(session, round)`: locked, ready, live, completed or incomplete. The order is strict: screening → HR BP → functional → CEO.
- `canRetry(round)`: the verdict is needs improvement and this is try 1. A retry creates a try 2 row, marks it current, and **its score replaces try 1 in every average**.
- `canResume(round)`: only if `resume_used` is false. The first disconnect shows the resume screen; resuming sets `resume_used`. A second disconnect ends the round as incomplete.
- `ceoUnlocked(session, institute)`: the average of the current screening, HR BP and functional scores is at least `institute.ceo_threshold`.
- `canRequestRestart(session)`: the session is completed or the student can go no further, and no request is pending. Only the institute approves; once approved, the student's Restart button creates attempt 2 from screening and keeps attempt 1 in history.
- `canPrintCv(session, offer)`: all rounds are done and the offer is accepted.
- `reportsUnlocked(session)`: the session is completed or the student can go no further.

The "Your attempts" card, the retry buttons, the resume screen, the CEO lock meter, the Print CV lock and the restart card all read these functions, with real remaining counts.

Design mode stays: it bypasses locks visually and jumps between states. It now works by switching which mock student you are signed in as, or by editing that student's rows. It must never change the rule functions. Make it available in the institute app too.

## 5. Fix the candidate flow

**Home and profile**
- **First visit, no CV yet:** show a calm welcome ("Welcome, Riya") and one large folder card: "Upload your CV · PDF, up to 10 MB". Dropping or choosing a file shows "Sera is reading your CV…" (simulated, about 2 s), then fills the profile and shows the sections list. Keep a "Fill in manually" option.
- **Profile editor bug:** each section must open its own fields, not the Project fields every time. The fields:
  - **Personal:** name, email, phone, city, LinkedIn, photo.
  - **Education:** degree and branch, college, graduating year, CGPA or percentage; optional Class XII and X boards, years and marks, and any education gap.
  - **Skills:** technical skills and tools as chips, each with a level (basic, intermediate or advanced); soft skills.
  - **Job preferences:** role, preferred cities, expected CTC, open to relocate, available from.
  - **About you:** short summary, drafted by Sera.
  - **Internships and work:** repeatable entries of company, role, dates, type and what you achieved.
  - **Projects:** repeatable entries of title, tech stack, your role, impact and link.
  - **Certifications:** repeatable entries of name, issuer, year and link.
  - **Achievements and coding profiles.**
  - **Activities and leadership.**
  - **Languages.**

  Fields pre-filled from the CV show the small sparkle. Optional sections keep "Skip for now". Save writes through `saveProfileSection` and returns to the list.
- Start interview and Print CV use the rule functions.

**Interview**
- The **left Round reports panel** reads live round data. While a round is live, its progress percentage rises with the simulated timer. When the round ends, the panel shows the score, the verdict and a one-line takeaway.
- **Company picker:** show the 3 companies matching the student's tier from `getCompanyOptions`. The choice is saved to the session, and every later screen shows that company's name. Once chosen, the company can't be changed within the attempt.
- **Live interview:**
  - a real countdown clock (screening 5:00, HR BP 8:00, functional 10:00, CEO 6:00);
  - the turn indicator alternates between "Sera is speaking" and "Your turn · 0:30" every few seconds;
  - the orb breathes faster while the interviewer speaks;
  - Mute works;
  - End round, or the timer reaching zero, calls `endRound` and moves to the result;
  - a "Simulate disconnect" control exists in Design mode only.
- **Aptitude:** 8 real MCQs across topics (quant, logical, SQL or role-specific, verbal) and 2 written questions with text areas. Answers persist, the navigator marks answered questions, the timer runs, and Submit scores the MCQs and then starts the functional interview.
- **Round result:** uses that round's data (score, rubric bars, strengths, gaps with timestamps, expertise, notes forwarded to the next interviewer). Retry works as described in section 4. "Next round" moves to the next round's pre-check.
- **CEO lock:** shows the real average against the institute threshold, and each round's current score.
- **Offer:** Accept or Decline calls `decideOffer`. Accepting unlocks Print CV and Reports straight away.

**Reports:** locked with a calm explanation until `reportsUnlocked`. Once unlocked, everything comes from `getMyReport`. Add an **attempt history** section. The restart card follows `canRequestRestart`.

**Resources:** filter by the student's actual gap types first; free resources before paid ones.

**Print CV:** fill the CV preview from the profile data. The three templates (Classic, Modern, Compact) must visibly differ, and it must print cleanly to A4 through `window.print` with a print stylesheet.

## 6. Fix the institute app

- The institute name, logo and batches come from the signed-in user's institute. Signing in as staff of the second institute must show completely different students.
- **Overview:** every KPI and chart is computed from mock data:
  - the funnel: invited → profile done → screening → HR BP → functional → CEO unlocked → offer accepted;
  - readiness distribution, restart requests pending, and recent activity.
- **Students:**
  - Filters that actually work: batch, status, round reached, verdict, readiness band, weak area, plus search.
  - A **live status** column (for example "In HR BP round now", "Waiting for retry", "Offer accepted").
  - Row selection with "Export selected (CSV)", which downloads a real CSV.
- **Student detail:** every tab uses that student's data: profile (read-only), rounds with evidence, full report, attempts, and restart requests with Approve and Decline calling `decideRestart`.
- **Batches:** real student counts and completion per batch, copying invite codes, and a CSV roster upload that parses the file and adds invited students.
- **Analytics:**
  - weak areas with the percentage of students affected;
  - pass rate by round;
  - score distribution;
  - improvement after retries;
  - sector preferences;
  - top performers and students needing attention.

  All of it is computed from data.
- **Settings:** team list, role badges and the privacy toggles. A viewer cannot approve restarts or change settings; only an admin can.

## 7. Build the full institute reports

Both reports are printable A4, one component per page, with page breaks, the institute's branding, and page numbers in the footer. Export uses `window.print` with a print stylesheet, and every export calls `logAudit`.

**Individual student report** (any student, from their data):

1. Cover.
2. Executive summary.
3. Round-by-round: score against the pass bar, verdict, strengths, gaps with evidence quotes and timestamps, forwarded notes.
4. Aptitude breakdown: MCQ accuracy by topic, and written-answer feedback.
5. Skills against the company's needs (chart).
6. Communication metrics: clarity, structure, filler words and pace.
7. Gap diagnosis with the recommended resources.
8. Roadmap: now, next and later.
9. Attempt history and improvement trend.
10. Profile snapshot and CV strength tier.
11. Placement-cell recommendation: ready to place, place with training, or needs intensive training.

**Batch progress report** (pick the batch and date range):

1. Cover with headline KPIs.
2. Funnel with counts and percentages.
3. Outcome split: offers, CEO cleared, passed some rounds, needs improvement, not started.
4. Readiness distribution against the previous period.
5. Pass rates and average scores by round.
6. Top cohort weak areas, with the percentage affected and suggested training.
7. Improvement after retries.
8. Sector and company preferences.
9. Student-wise summary table.
10. Recommended actions for the placement cell.

On **Reports and exports**, the institute user chooses: individual (pick a student) or batch (pick a batch). Also offer CSV exports of students and round results.

## 8. Final checks before you finish

- Formatting and linting pass, and there are no TypeScript errors.
- Sign in as a student from institute 1, then as staff from institute 2, and confirm neither can see the other's data.
- Walk through one full journey with no Design mode, starting from a student with no CV: upload → profile → company → screening → HR BP → aptitude and functional (fail once, retry and pass) → CEO unlocked → accept offer → Print CV → Reports.
- Check mobile at 390 px for every candidate screen.
- Update `README.md` with the folder structure, the mock users to sign in as, and how Design mode works.

## 9. Data contract: types only, no database

Build the TypeScript types and mock data to match these tables and fields exactly. Do not create a database or SQL for them.

- **institutes:** id, name, slug, logo_url, plan, status, pass_bar (60), ceo_threshold (65), created_at
- **institute_users:** id, institute_id, auth_user_id, email, name, role ('admin' | 'viewer'), status, created_at
- **batches:** id, institute_id, name, program, year, invite_code, created_at
- **students:** id, institute_id, batch_id, auth_user_id, email, name, photo_url, status ('invited' | 'active' | 'archived'), consent_at, created_at
- **student_profiles:** student_id, institute_id, personal, education, skills, preferences, summary, experience[], projects[], certifications[], achievements[], activities[], languages[], strength_score, strength_tier, required_complete, cv_file_key, cv_extracted, updated_at
- **company_profiles:** id, source ('web' | 'manual' | 'yzi_dashboard'), name, sector, sub_sector, city, size, role, ctc_min, ctc_max, tier, jd, requirements[], interview_style, sources[], is_sample, generated_at, expires_at
- **interview_sessions:** id, institute_id, student_id, attempt_no, company_profile_id, company_options[], context, status ('in_progress' | 'completed' | 'abandoned' | 'restarted'), average_score, ceo_unlocked, started_at, completed_at
- **session_rounds:** id, institute_id, session_id, round ('screening' | 'hr_bp' | 'functional' | 'ceo'), try_no (1 | 2), is_current, persona, retell_agent_id, retell_call_id, status ('locked' | 'ready' | 'live' | 'completed' | 'incomplete'), progress_pct, score, verdict ('passed' | 'needs_improvement'), rubric, strengths, gaps, expertise, notes_for_next, transcript_key, resume_used, disconnect_count, duration_sec, started_at, ended_at
- **aptitude_attempts:** id, institute_id, round_id, questions, answers, mcq_score, written_feedback, submitted_at
- **offers:** id, institute_id, session_id, role, ctc, joining, decision ('pending' | 'accepted' | 'declined'), decided_at
- **reports:** id, institute_id, session_id, overall_score, verdict, report, pdf_key, created_at
- **gap_diagnoses:** id, institute_id, session_id, gap_type ('communication' | 'skill' | 'expectation' | 'aptitude'), title, evidence, resource_ids[]
- **resources:** id, gap_type, skill, level, title, url, kind, is_paid, is_affiliate
- **restart_requests:** id, institute_id, student_id, session_id, reason, status ('pending' | 'approved' | 'declined' | 'used'), decided_by, decided_at, created_at
- **batch_reports:** id, institute_id, batch_id, period_start, period_end, summary, pdf_key, generated_by, created_at
- **consents:** id, institute_id, student_id, purpose, version, guardian_ref, at
- **audit_log:** id, institute_id, actor_id, actor_type, action, target_type, target_id, at

Every row that belongs to an institute carries `institute_id`. That is how the mock services enforce tenant isolation, and the real database will enforce it the same way later.
