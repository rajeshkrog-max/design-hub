# Sera round 2

- [ ] Rewrite src/types/arena.ts to match section 9 contract (snake_case, all tables)
- [ ] Rebuild src/data/mock/ as one file per table (2 institutes, 4 staff, 3 batches, 25 students, profiles, sessions, rounds, aptitude, offers, reports, gaps, resources, restart requests, consents, audit)
- [ ] SessionProvider + "Sign in as" demo picker on login pages
- [ ] Service layer in src/services/ (student + institute), localStorage persistence, tenant isolation, access guard, logAudit
- [ ] Extend src/lib/rules.ts (profileStrength, roundStatus, ceoUnlocked, canRequestRestart, reportsUnlocked, etc.)
- [ ] Split components: candidate/, institute/, reports/, shared/
- [ ] Candidate flow: CV upload, profile editor sections, live round data, company picker, countdown/turns, aptitude, retry/resume, CEO lock, offer, reports, resources, Print CV templates
- [ ] Institute app: overview KPIs, student filters + CSV export, student detail tabs, batches + roster upload, analytics, settings roles
- [ ] Institute reports: individual (11 pages) + batch (10 pages), printable A4, logAudit
- [ ] Final checks: typecheck, tenant isolation, full journey, mobile 390px, README update
