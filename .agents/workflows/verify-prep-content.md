---
description: Validate prep tracker content against the handbooks' facts and the outline's method, and re-run resolver persona tests after any content edit.
---

# Verify prep tracker content

// turbo
1. Run `node prep-tracker-kit/scripts/validate-content.mjs prep-tracker-kit/content`.

2. Read the weekly hours table it prints. Light weeks must stay between about 12 and 15 hours, Intensive between about 18 and 22.

3. Search the tracker's UI copy, seed files and translations for the banned terms and facts listed in `.agents/rules/prep-tracker-content.md`. Report every hit with file and line.

// turbo
4. Run the resolver unit tests, including the persona fixtures from `prep-tracker-kit/SPEC.md` §13.

5. If content changed, confirm no existing task `id` was renamed or removed. Compare against the previous version of the JSON in git and list any id differences. Removed ids need a migration note, because students may already have progress on them.

6. Summarise results as a short report: pass or fail, hours table, banned-content hits, id changes.
