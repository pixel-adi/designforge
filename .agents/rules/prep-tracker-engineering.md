---
trigger: model_decision
description: Engineering conventions for building or changing the NID prep tracker feature inside the existing Designforge student portal.
---

# Prep tracker: engineering rules

## Fit the portal, don't fork it

- Before writing code, identify the portal's framework, router, state management, data layer, auth, design system, test runner and lint rules. Follow them exactly.
- Reuse existing components, tokens, layouts and API clients. Do not add a new UI kit, CSS framework or state library.
- Put the feature where similar features live. Match naming and folder conventions.
- If the portal has no database-backed store for something the spec needs (for example file uploads), stop and propose options in the implementation plan rather than inventing infrastructure.

## Content handling

- Treat `prep-tracker-kit/content/*.json` as read-only source data. Load it at build time or seed it into the database, whichever matches the portal's pattern for static content.
- Task `id`s are stable keys for student progress. Never regenerate, renumber or derive them from array positions.
- All personalisation (tier, band, axis, discipline group) goes through one pure resolver function, described in `prep-tracker-kit/SPEC.md` §6. UI components never branch on raw task fields.
- Keep `schemaVersion` with any seeded content and refuse to load a major version you don't support.

## Quality bar

- Unit tests for the resolver, band calculation, weak-axis selection, M.Des discipline-combination validation, date logic in Asia/Kolkata, and completion percentages, including the persona fixtures in SPEC §13.
- Run `node prep-tracker-kit/scripts/validate-content.mjs prep-tracker-kit/content` in CI.
- Accessible by default: keyboard operable, visible focus, labels on every input, sufficient contrast, reduced motion respected, works at 360 px wide.
- No `localStorage` as the system of record; progress belongs in the portal's backend so it follows the student across devices.
- Verify in the browser before handing off: onboarding for UG and PG, completing a day, logging a simulation with ledger entries, the Sunday review, and the week-8 re-score.
