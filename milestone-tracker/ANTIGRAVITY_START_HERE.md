# Designforge NID prep tracker: Antigravity kit

This kit adds the 92-day NID DAT 2027 prep tracker to the existing Designforge student portal using Google Antigravity's agent. It replaces the earlier prototype's curriculum.

## What's inside

```
.agents/
  rules/
    prep-tracker-content.md        always on: facts, banned content, method, copy
    prep-tracker-engineering.md    model decision: fit the portal, testing bar
  workflows/
    build-prep-tracker.md          /build-prep-tracker
    verify-prep-content.md         /verify-prep-content
  skills/
    nid-prep-content/SKILL.md      editing content and handling handbook amendments
prep-tracker-kit/
  SPEC.md                          features, resolver, data model, tests
  SOURCES.md                       handbook and outline references, resolved conflicts
  content/
    plan.ug.json                   B.Des and Integrated M.Des, 92 days
    plan.pg.json                   M.Des, 92 days, per discipline group
    reference.json                 exam facts, timelines, disciplines, drills, templates
  scripts/
    validate-content.mjs           dependency-free validator (Node 18+)
```

## Setup

1. Copy `.agents/` and `prep-tracker-kit/` into the root of the student portal repository. If the repo already has an `.agents/` (or older `.agent/`) folder, merge the files into it.
2. Make sure `.agents/` is not in `.gitignore`, so Antigravity can index the rules and workflows.
3. Open the repository in Antigravity. Under Customizations, check that both rules and both workflows are listed.
4. Run `node prep-tracker-kit/scripts/validate-content.mjs prep-tracker-kit/content` once yourself. It should end with "All content checks passed."

## Kick off the build

Open the Agent Manager, start a new task in the portal workspace with planning enabled, and paste this:

```
/build-prep-tracker

Build the NID DAT 2027 prep tracker into this student portal, following
prep-tracker-kit/SPEC.md and the workspace rules. The content JSON in
prep-tracker-kit/content is the only curriculum; do not add or rewrite
tasks, and never add GK, reasoning, English or quantitative drills.

Stop after the implementation plan and wait for my review before writing
feature code. In the plan, answer the open decisions in SPEC §14 from what
you find in the codebase, and list the ones you couldn't.

The plan starts Saturday 19 September 2026, so onboarding, the diagnostic
and the Day 1 view are the priority if we need to ship in stages.
```

## Reviewing the agent's plan

Check these before you approve:

- It reuses the portal's existing auth, database, design system and API style.
- Task ids from the JSON are used unchanged as progress keys.
- There is one resolver function with unit tests for the four personas in SPEC §13.
- The M.Des discipline-combination rules are validated in onboarding.
- No fixed Mains weighting, no 1.5× figure, and no aptitude drills appear anywhere.
- If you want a staged release, a sensible first cut for 19 September is F1, F2, F3, F4 and F12, with F6 to F9 by the end of week 1 and the rest by week 4.

## After the build

- Run `/verify-prep-content` after any content change.
- When NID posts an amendment on admissions.nid.edu, ask the agent to use the nid-prep-content skill to update dates and milestones.
- Before sharing the outline PDF with the batch, update its shortlisting and weighting figures to match the handbooks. See SOURCES.md.
