---
description: Build the NID DAT 2027 92-day prep tracker into the existing Designforge student portal from the prep-tracker-kit spec and content.
---

# Build the prep tracker

Work through these steps in order. Stop where a step says to wait for review.

1. Read `.agents/rules/prep-tracker-content.md`, `.agents/rules/prep-tracker-engineering.md`, `prep-tracker-kit/SPEC.md` and `prep-tracker-kit/SOURCES.md` in full.

// turbo
2. Run `node prep-tracker-kit/scripts/validate-content.mjs prep-tracker-kit/content` and confirm it passes. If it fails, stop and report the errors; do not edit the content to make it pass.

3. Explore the portal codebase and write down, in the implementation plan:
   - framework, language, router and rendering model
   - how authentication and the current student are resolved
   - database or backend, ORM, and how migrations and seeds are run
   - design system components and tokens you will reuse
   - whether a mentor or admin role exists, and whether file uploads are supported
   - the test runner, lint and type-check commands

4. Produce an implementation plan artifact that maps every feature in SPEC §7 (F1 to F13) to concrete files, data tables, endpoints and components in this codebase. Include the migration plan, the content-loading approach and the test plan. List any SPEC §14 open decisions you could not resolve from the code.

5. Wait for the portal owner to review and approve the implementation plan before writing any feature code.

6. Data layer: add the tables or collections from SPEC §8, the migration, and the content loader or seed for both tracks. Keep task ids exactly as in the JSON.

7. Resolver: implement the pure `resolveDay` and `resolveTask` functions from SPEC §6 with unit tests covering the four persona fixtures in SPEC §13 and every `when` key.

8. Server or API: implement the operations in SPEC §9 using the portal's existing API pattern, with authorisation so a student only reads and writes their own records.

9. UI, in this order, using existing components:
   1. Onboarding (F1) including the M.Des discipline-combination validator and the diagnostic (F2)
   2. Today and day view (F3), 92-day board (F4) and the non-negotiables strip
   3. Simulation log and error ledger (F6, F7)
   4. Critique submissions (F8) and Sunday review (F9)
   5. Diary, explanation cards, awareness cards and build archive (F10)
   6. Progress and week-8 re-score (F5, F11), exam timeline and admin milestones (F12)
   7. Mentor view (F13) only if a mentor role already exists

// turbo
10. Run the portal's lint, type-check and test commands, plus the content validator. Fix failures.

11. Use the browser to verify the flows in SPEC §13 against a local build. Capture screenshots of: UG onboarding, PG discipline validation error, a completed day, a logged simulation with ledger entries, the Sunday review, and the week-8 re-score.

12. Produce a walkthrough artifact with the screenshots, a list of files changed, how to run migrations and seeds in each environment, and any follow-ups.
