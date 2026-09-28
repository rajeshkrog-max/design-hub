# Sera Interview Arena

Front-end prototype of Sera Interview Arena, backed by typed mock data
(`src/data/mock`) and tenant-scoped services (`src/services`).

## Read first
Read docs/HANDOFF.md first.

1. `docs/STATUS.md`: current state, gaps and priorities. Read it before any work.
2. `docs/spec-round2.md`: the spec.
3. `docs/sera-arena-reference.html`: the agreed design.

## Rules
- Front end only. No Supabase, database or API keys. Never run `docs/schema.sql`.
- All business rules live in `src/lib/rules.ts`.
- Services always filter by student or `institute_id`.
- Keep the claymorphism design.
- No force-push or amend. Push only when the user says "push".
- Ask before adding dependencies.
