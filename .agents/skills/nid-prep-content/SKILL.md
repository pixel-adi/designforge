---
name: nid-prep-content
description: Use when editing, extending or answering questions about the NID DAT 2027 prep tracker curriculum files (plan.ug.json, plan.pg.json, reference.json), or when NID publishes a handbook amendment that changes dates or exam rules.
---

# Working with prep tracker content

## Files

- `prep-tracker-kit/content/plan.ug.json`: 92 days for B.Des and Integrated M.Des (after Class 12).
- `prep-tracker-kit/content/plan.pg.json`: 92 days for the 2.5-year M.Des.
- `prep-tracker-kit/content/reference.json`: exam facts, timelines, disciplines, diagnostic, drills, templates, resolved conflicts.
- `prep-tracker-kit/SOURCES.md`: where every fact came from.

## Structure of a plan

`days[]` runs from 2026-09-19 (day 1) to 2026-12-19 (day 92). Week 0 is Saturday and Sunday 19 to 20 September. Weeks 1 to 12 run Monday to Sunday from 21 September. Week 13 is Monday 14 to Saturday 19 December.

Each task has `id`, `block`, `module`, `title`, `detail`, `minutes.light`, `minutes.intensive`, and optionally `optional`, `when`, `variants`, `byGroup`, `axisSlot`, `capture`, `kind` and `source`. `null` minutes means the task is not part of that tier.

## Safe edits

1. Keep every existing `id`. To retire a task, set both minutes to `null` rather than deleting it, and note it in the changelog.
2. New tasks get the next free index for that day, following the pattern `{track}-d{day:03}-{index:02}-{block}`.
3. Every task needs a `source` pointing to a handbook section or outline section.
4. PG tasks with `byGroup` must cover G1, G2, G3, G4, G5 and GX.
5. Run the validator after every edit and keep weekly hours in range.

## When NID amends a handbook

NID posts changes only in the Amendments section on admissions.nid.edu. When dates or rules change:
1. Update `reference.json > timeline` and `exam`, with the amendment date in `SOURCES.md`.
2. Update any milestone task whose date or wording changed. If a milestone moves to another day, add it to the new day with a new id and set the old one's minutes to `null`.
3. Update the `MILESTONES` map in the validator to match.
4. Run `/verify-prep-content`.

## Things that stay out, whatever the request

General-ability drills, invented weightages, the 1.5× figure, and eligibility decisions. See the always-on content rule.
