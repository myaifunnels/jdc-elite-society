# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students** in Project JDC, a 30-day coaching program inside JDC Elite Society. Mostly Filipino, not technical, and about 90% use a phone. Their job: see what to do today, mark it done, and feel progress.
- **Facilitators**, who coach a group of students (target 20–100 each). Also not technical and mostly on a phone. Their job: give students daily tasks, check and approve finished tasks, set their own weekly commitment and target, and see which students need attention.
- **Admin** (Coach JDC and team). Adds facilitators and students, assigns students to facilitators, and watches overall progress and status. Gets the same simple app treatment, with the full roster close at hand.

## Product Purpose

Project JDC is the daily accountability tool of JDC Elite Society. It replaces the Google Sheets trackers (Facilitator Weekly Commitment & Target Tracker, Student Roster & Progress Tracker). Success means a student or facilitator can do their job in a few taps on a phone without help, and that a 12-year-old could understand every screen.

## Operating Context

- Lives at coachjdc.org → Dashboard → Project JDC, inside the existing member dashboard (Next.js app, Render auto-deploys `main`).
- Daily tasks cover fitness, learning, meditation/prayer, planning, and content creation (posting on social media is one of the main kinds of task).
- Flow: facilitator adds a task → student marks it done → facilitator approves.
- Weekly: facilitator sets a day-by-day commitment and a target count (e.g. new Elite members); progress counts new students they enrolled that week.
- Status for students and facilitators: Active, At Risk, Inactive, Completed.

## Capabilities and Constraints

- Server-rendered Next.js with server actions and Postgres (`src/lib/project-jdc-store.ts`).
- Roles: admin, facilitator, student, gated by the `projectJdc` capability.
- Language: simple, plain English. Short words, no jargon.
- Mobile-first: most users are on phones.

## Brand Commitments

- JDC Elite Society brand (see `BRAND.md`): cobalt royal blue, chrome/metal accents, direct and warm voice, speaks to the reader as "you", no hype.

## Product Principles

1. One screen, one job. Never show everything at once.
2. A few taps to anything. Big, obvious buttons a child could use.
3. Plain words. If it needs explaining, rewrite it.
4. Show progress, not paperwork. Celebrate what got done.
5. Messages and confirmations are short, friendly, and tell you what happens next.

## Accessibility & Inclusion

- Non-technical users: large tap targets, high contrast, plain language, no hidden gestures required.
