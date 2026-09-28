# Sera Interview Arena front-end

## Goal
Build a polished, responsive front-end prototype for students and institute staff using the uploaded product brief and reference experience. Everything will run from typed mock data; no backend, authentication service, payments, or paid APIs will be connected.

## What I’ll build
- A premium public landing page, login choice, student access, institute access, and invite acceptance views.
- A mobile-first student workspace with Home, Interview, Reports, and Resources.
- Profile strength, CV upload/read state, editable profile sections, company matching, all four interview rounds, aptitude flow, pre-checks, interview simulation, feedback, retries, disconnect/resume states, CEO lock/offer, downloadable-style CV preview, and full readiness report.
- A desktop-first institute workspace with Overview, Students, student detail, Batches, Analytics, Reports and exports, and Team and settings.
- Polished individual and batch report previews designed as printable A4 pages.
- A development-only Design mode panel for jumping between important states while preserving the real lock rules.

## Visual direction
- Refined soft claymorphism on warm grey, with restrained dual shadows, inset selected states, generous spacing, and one dominant charcoal action per screen.
- Consistent round palette: sage screening, amber HR, rose functional, soft blue CEO.
- Clean sans typography, sentence case, visible focus styles, gentle progress and breathing-orb motion, plus responsive mobile/tablet layouts.

## Technical details
- Keep TanStack Start routing and use React, TypeScript, Tailwind v4, Recharts, and local React state.
- Add shared design tokens, focused reusable UI pieces, a typed mock data layer, services that enforce institute/student scoping, and centralized business rules.
- Seed realistic mock records covering each requested state.
- Do not create or run backend/database migrations because the user explicitly requested front end only.
- Add unique page metadata and verify the finished experience in desktop and mobile browser sizes.
