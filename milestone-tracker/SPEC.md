# NID DAT 2027 prep tracker: product and build spec

Version 2.0 · For the Designforge student portal · Content schema 2.0.0

## 1. Goal

Give every Designforge student a day-by-day plan from **Saturday 19 September to Saturday 19 December 2026**, the day before the DAT Prelims, that they can tick off, log simulations against, get critique on, and review weekly. The plan follows the Designforge Self-Study Outline's operating system, compressed to 13 weeks, and every exam fact follows the NID Admissions Handbooks 2027-28.

Success looks like students who keep the four non-negotiables going every week, log every simulation with an error ledger, and reach the Prelims with a body of work they can talk about in the Mains.

## 2. Sources and precedence

1. `content/plan.ug.json`, `content/plan.pg.json`, `content/reference.json` (this kit)
2. NID Admissions Handbooks 2027-28 (binding for facts)
3. Designforge Self-Study Outline, Edition 02 (binding for method)

Handbook beats outline on any conflict. See `SOURCES.md` for every resolved conflict.

## 3. Users

- **Student** (primary). Signed in to the portal. Owns all their tracker data.
- **Mentor** (only if the portal already has this role). Sees assigned students' critique submissions and simulation logs, and marks feedback as given.
- **Content admin** (engineering). Updates JSON content when NID amends a handbook.

## 4. Scope

In scope: F1 to F13 below.

Out of scope for this release: question banks or MCQ practice of any kind, automatic scoring of drawings, eligibility decisions, payments, notifications beyond what the portal already supports, and Mains preparation after 20 December (the post-exam timeline is shown, but no tasks are scheduled).

## 5. Content package

| File | What it holds |
|---|---|
| `plan.ug.json` | Track `ug`: B.Des and 5.5-year Integrated M.Des (after Class 12). 92 days, 281 task records. |
| `plan.pg.json` | Track `pg`: 2.5-year M.Des (after graduation). 92 days, 284 task records, group-specific text. |
| `reference.json` | Exam facts, both timelines, disciplines and combination rules, tiers, diagnostic axes and bands, drawing levels, ideation methods, building drills, templates, question bank, portfolio spine, resources, resolved conflicts. |
| `scripts/validate-content.mjs` | Dependency-free validator. Run in CI. |

### Plan shape

```
Plan { schemaVersion, track: "ug"|"pg", title, startDate, endDate, examDate,
       tiers: { light, intensive }, phases[], weeks[], days[] }
Phase { id, name, startDate, endDate, summary }
Week  { week: 0..13, startDate, endDate, theme, phaseId, diaryTheme }
Day   { day: 1..92, date: "YYYY-MM-DD", weekday, week, phaseId, title, tasks[] }
Task  { id, block, module, title, detail,
        minutes: { light: int|null, intensive: int|null },
        kind: "task"|"milestone"|"simulation"|"review",
        capture: CaptureType[],
        optional?: { light?: bool, intensive?: bool },
        when?: When,
        variants?: [{ when: When, title?, detail?, minutes? }],
        byGroup?: { G1..GX: { title?, detail? } },
        axisSlot?: 1|2,
        source: string[] }
When  { bands?: ("foundation"|"standard"|"sharpening")[],
        axisBelow?: { [axisId]: int }, axisAtLeast?: { [axisId]: int },
        hasSecondaryGroupX?: bool }
```

**Blocks:** `drill`, `build`, `critique`, `simulation`, `simulation_review`, `sunday_review`, `field_mission`, `axis_block`, `awareness_card`, `making_drill`, `articulation`, `redo`, `mock_conversation`, `admin`, `diagnostic`.

**Modules** (used for coverage views): `observation`, `drawing`, `ideation`, `form_material`, `articulation`, `awareness`, `domain`, `portfolio`, `simulation`, `strategy`, `admin`.

**Capture types** (which form a task opens): `diagnostic`, `diaryEntry`, `explanationCard`, `buildPhoto`, `reviewSubmission`, `simulationLog`, `errorLedger`, `sundayReview`, `awarenessCard`, `pitchRecording`, `mockConversation`, `disciplineChoice`.

### Calendar

- Week 0: Sat 19 and Sun 20 September (orientation, diagnostic, application prep).
- Weeks 1 to 12: Monday to Sunday, 21 September to 13 December.
- Week 13: Monday 14 to Saturday 19 December (taper).
- Milestones are already placed on 3 Oct, 30 Nov, 1 Dec and 10 Dec.

## 6. Personalisation: the resolver

Everything the UI shows comes from one pure function. Put it in a shared module with unit tests.

### Student profile inputs

- `track`: `ug` or `pg`
- `tier`: `light` or `intensive`
- `diagnostic`: the latest submitted scores, `{ observation, drawing, ideation, form_material, articulation, awareness }`, each 1 to 5
- `disciplines` (PG only): one to three discipline names from `reference.disciplines.pg`

### Derived values

- `total` = sum of the six axis scores (6 to 30).
- `band`: 6–13 `foundation`, 14–22 `standard`, 23–30 `sharpening`. Before the first diagnostic is submitted, use `standard`.
- `axis1`, `axis2`: the lowest and second-lowest axes. Break ties in this order: `form_material`, `articulation`, `observation`, `drawing`, `ideation`, `awareness` (the outline marks the first two as NID-heavy).
- `primaryGroup` (PG): the group of the first chosen discipline that is not in Group X. If every choice is in Group X, `GX`.
- `hasSecondaryGroupX` (PG): a Group X discipline is chosen and `primaryGroup` is not `GX`.

### Algorithm

```
resolveTask(task, profile):
  if task.when and not matches(task.when, profile): return hidden
  minutes = task.minutes[profile.tier]
  if minutes is null: return hidden
  out = { id, block, module, kind, capture, title, detail, minutes,
          optional: task.optional?.[profile.tier] === true }
  if task.byGroup and profile.track == "pg":
      apply task.byGroup[profile.primaryGroup] over out.title / out.detail
  for v in task.variants (in order):
      if matches(v.when, profile):
          apply v.title, v.detail, v.minutes?.[profile.tier] over out
          break
  replace "{axis1}" and "{axis2}" in title/detail with axis display names
  return out

matches(when, profile):
  bands            -> profile.band in when.bands
  axisBelow        -> every axis score < value   (before a diagnostic: true)
  axisAtLeast      -> every axis score >= value  (before a diagnostic: false)
  hasSecondaryGroupX -> equals profile.hasSecondaryGroupX
  all present keys must match

resolveDay(day, profile) = day with tasks mapped through resolveTask, hidden removed
```

Personalisation must be recomputed when the student changes tier, re-scores the diagnostic, or (PG) before their application is submitted, changes disciplines. Completion records are keyed by task `id`, so they survive these changes.

### Completion

- A task counts toward completion only if it is visible and not optional.
- A day is complete when all its counted tasks are done.
- Week and plan percentages are counted tasks done / counted tasks visible.
- Minutes logged = sum of resolved minutes of done tasks (optional ones included).

## 7. Features and acceptance criteria

### F1. Onboarding

- Step 1, programme: "B.Des and Integrated M.Des (after Class 12)" or "M.Des (after graduation)". Show that a candidate can apply for only one, and that programme, name, date of birth, mobile and email can't be changed after submission.
- Step 2, PG only, disciplines: choose one to three from the six groups in `reference.disciplines.pg`. Validate the combination rules live and explain any rejection in plain words, for example "Two disciplines must be in the same group, or one of them must be in Group X." Show that the fee is per discipline, and that NID MP and NID Haryana need separate applications.
- Step 3, tier: Light (about 12 to 15 hours a week) or Intensive (about 18 to 22). Show the outline's warning that below eight hours a week the plan fails.
- Step 4, diagnostic (F2).
- The student can change tier any time from settings. PG disciplines can be edited until the student marks the application submitted.

**Accept when** a UG and a PG student can each finish onboarding, invalid PG combinations cannot be saved, and the resulting plan starts on 19 September.

### F2. Diagnostic

- Six axes, 1 to 5, each with its "score 5 looks like" description from `reference.diagnostic.axes`.
- On submit, show the total, the band and that band's `portalMessage`, plus the two weakest axes and their `fixDrill`.
- Week 8 re-score (Sunday 15 November) hides previous scores until the new ones are submitted, then shows a side-by-side comparison and flags axes that did not move with the rule text.

**Accept when** band boundaries 13/14 and 22/23 are correct, ties resolve per §6, and earlier scores are hidden during re-score.

### F3. Today and day view

- Opens on today's day in Asia/Kolkata. Before 19 September show a countdown and Day 1; after 19 December show the exam timeline.
- Group tasks by block, in plan order. Each task shows title, detail, minutes and, where relevant, a chip for "Intensive plan" or "Optional".
- Checking a task records completion time. Tasks with `capture` open the matching form (F6 to F10); the task can be ticked without filling the form, but the form is one tap away.
- Show the four non-negotiables for the current week with live status.
- Previous day, next day and "Go to today" controls.

**Accept when** ticking a task updates day, week and plan progress without a reload, and the view is usable at 360 px wide.

### F4. 92-day board

- A calendar grid of all 92 days grouped by phase, weeks aligned Monday to Sunday (week 0 occupies Saturday and Sunday).
- Each tile shows date and completion, marks simulation days and milestone days, and highlights today.
- Tapping a tile opens that day.

### F5. Progress

- Plan, week and module completion (modules from §5).
- Counters with outline targets: diary pages (24 by week 4, 60+ by week 10), builds photographed (target 40), awareness cards (Light plan builds about 7, Intensive 20+), pitches recorded, simulations logged.
- Ten-in-ten tracking: optional numeric field for "concepts after minute six" on drill logs, charted against the week-12 target of six.

### F6. Simulation log

- Fields from `reference.simulationLogFields`. Self-score and mentor score are optional, 0 to 100, and labelled "your rubric score"; NID doesn't publish marks breakdowns.
- Show a trend of self-scores and a count of dominant buckets over time.
- After a full simulation is logged, prompt the review protocol steps from `reference.reviewProtocol`.

### F7. Error ledger

- Fields from `reference.errorLedgerFields`; bucket is one of concept, time, clarity, care.
- When the same bucket appears three or more times in the last 14 days, show the rule "An error logged three times is a gap in method: it needs a drill, not more effort" with that bucket's fix from `reference.errorBuckets`.
- The Weak-area repair build blocks in weeks 11 and 12 (UG) link straight to this view filtered to the top bucket.

### F8. Critique submissions

- From a critique or simulation task, the student attaches work (images if the portal supports uploads, otherwise a link) and a two-line note.
- Show the three critique questions from `reference.critique.frame`.
- Status: Not submitted, Submitted, Feedback received. If a mentor role exists, mentors set Feedback received; otherwise the student does, and can record who gave it.

### F9. Sunday review

- Three written fields and the eight-item week completion check from `reference.sundayReview`.
- Pre-fill the completion check from tracker data where possible (drill days done, builds done, simulation logged, critique submitted, diary entries, ledger updated) and let the student adjust the rest.
- Show the week's checkpoint text when the task detail includes one.

### F10. Diary, cards and archive

- Diary entry: date, place, theme (pre-filled with the week's diary theme) and the four quadrants; optional photo.
- Explanation card: the five lines from `reference.explanationCard`, attachable to any task with that capture.
- Awareness index card: the four fields from `reference.awareness.indexCardFields`, with a list view and a "argue the opposite" prompt.
- Build archive: photos with a caption and which building drill they belong to.
- Pitch and mock-conversation logs: date, project or topic, link to recording, filler words or hesitations noted.

### F11. Weak-axis blocks

- Intensive: two 90-minute blocks a week, Tuesday for `axis1` and Thursday for `axis2`.
- Light: an optional 45-minute Tuesday block for `axis1`, shown only for the foundation and standard bands.
- Each block shows the axis's `fixDrill`.

### F12. Exam timeline and admin

- The track's `reference.timeline` as a vertical timeline, with the scorecard note.
- Admin milestone tasks are highlighted on their days. The student can mark "Application submitted", after which PG disciplines lock.
- A reference panel with test cities, upload specs and fees, each with its handbook section and a link to admissions.nid.edu.

### F13. Mentor view (conditional)

Only if the portal already has mentors assigned to students: a list of assigned students with this week's non-negotiables, pending critique submissions and latest simulation logs. Mentors mark feedback given. No access to diagnostic scores unless the portal's consent model allows it.

## 8. Data model

Adapt names to portal conventions. All records belong to one student.

| Entity | Key fields |
|---|---|
| `PrepEnrolment` | studentId, track, tier, disciplines[] (PG), primaryGroup, applicationSubmittedAt, contentVersion, createdAt |
| `DiagnosticScore` | studentId, takenAt, week, observation, drawing, ideation, formMaterial, articulation, awareness, total, band |
| `TaskCompletion` | studentId, taskId, completedAt, minutesLogged, note |
| `SimulationLog` | studentId, taskId, date, paperOrBrief, timeTakenMinutes, finished, dominantBucket, answerRewritten, selfScore?, mentorScore? |
| `ErrorLedgerEntry` | studentId, simulationLogId?, date, whatWentWrong, bucket, rootCause, fixingDrill |
| `CritiqueSubmission` | studentId, taskId, attachments[], note, status, submittedAt, feedbackAt, feedbackBy |
| `SundayReview` | studentId, week, improvedWithEvidence, didNotMoveAndWhy, oneChange, completionCheck (8 booleans) |
| `DiaryEntry` | studentId, date, place, theme, whatISaw, howItWorks, whereItFails, whatIdChange, photo? |
| `ExplanationCard` | studentId, taskId?, who, whatBreaks, theMove, whyThis, whatItCosts |
| `AwarenessCard` | studentId, topic, whatItIs, whyItMattered, exampleSeen, opinion |
| `BuildRecord` | studentId, taskId?, drillNumber?, photos[], caption |
| `ArticulationLog` | studentId, taskId?, type (pitch or mockConversation), topic, recordingUrl?, notes |

Indexes: `(studentId, taskId)` unique on `TaskCompletion`; `(studentId, week)` unique on `SundayReview`.

## 9. Operations

Implement with the portal's existing API style. Every operation is scoped to the signed-in student unless noted.

- Get enrolment; create or update enrolment (tier, disciplines until submitted, application submitted)
- Get resolved day by date; get resolved week; get board summary (92 days with completion and markers)
- Mark task done or undone
- Submit diagnostic; list diagnostics
- Create, update and list: simulation logs, error ledger entries, critique submissions, Sunday reviews, diary entries, explanation cards, awareness cards, build records, articulation logs
- Get progress summary
- Mentor only (if the role exists): list assigned students' summaries; set critique feedback status

## 10. UI and copy

- Use the portal's design system. The tracker should feel like part of the portal, not a separate app.
- Sentence case, plain verbs, no all-caps labels. Buttons say what they do.
- Never promise a rank or selection. For the foundation band, the message is honest and kind.
- Exam facts shown in the UI always carry their source, e.g. "Source: NID Admissions Handbook 2027-28, section 3".
- Label practice timing as practice: "Designforge practice papers run three hours. NID states the actual duration on the admit card."
- Empty states direct the next action.

## 11. Dates and time

- All "today" logic in Asia/Kolkata. Plan dates are calendar dates, not timestamps.
- Future days are viewable and can be ticked (students work ahead), but the board distinguishes past, today and future.
- Milestone times are shown exactly as in the handbook, in IST.

## 12. Analytics (optional, only if the portal already tracks events)

`prep_onboarded`, `prep_diagnostic_submitted`, `prep_task_completed`, `prep_simulation_logged`, `prep_ledger_entry_added`, `prep_critique_submitted`, `prep_sunday_review_saved`, `prep_tier_changed`. No free-text content in event payloads.

## 13. Tests and verification

### Content
`node prep-tracker-kit/scripts/validate-content.mjs prep-tracker-kit/content` passes in CI.

### Resolver persona fixtures

| Persona | Profile | Expectations |
|---|---|---|
| P1 | UG, light, scores O2 D2 I2 F2 A2 Aw2 (total 12, foundation) | Day 3 (21 Sep) drill detail mentions "Drawing L0". Day 29 (17 Oct) simulation title is "Timed brief: theme to storyboard and poster". Day 32 (20 Oct) shows the optional 45-minute weak-axis block for Form and material. |
| P2 | UG, intensive, scores O4 D4 I5 F3 A4 Aw5 (total 25, sharpening) | Day 3 drill detail mentions "Drawing L1". Day 29 simulation title is "Full simulation: Prelims-style paper". Day 32 shows a 90-minute weak-axis block for Form and material; day 34 (22 Oct) a 90-minute block for the next-lowest axis. |
| P3 | PG, light, Product Design + Toy & Game Design (G4), scores total 18 (standard) | Day 8 (26 Sep) simulation title is "Timed brief: A torch for a power cut: five concepts, one developed". Day 31 (19 Oct) build detail starts "Teardown: exploded view and failure points of a torch". No Group X exercise on day 32. |
| P4 | PG, intensive, Graphic Design (G1) + Universal Design (GX), scores total 24 (sharpening) | Day 8 simulation title is "Timed brief: Tell a six-frame visual story about a lost object returning". Day 32 shows the optional Group X exercise. Day 58 (15 Nov) shows "Re-score your diagnostic". |

Also test: band boundaries, tie-breaks, discipline-combination validation (accept G4+G4, G4+GX, G4+G4+GX, GX alone; reject G1+G4, GX+GX, G1+G1+G1, G1+G4+GX), Asia/Kolkata date rollover at midnight, and completion excluding optional tasks.

### Browser flows

1. UG student onboards, scores the diagnostic, sees band message and weak axes.
2. PG student tries G1 + G4, sees the rule, fixes it to G1 + GX.
3. Complete all counted tasks on a day; the board tile and week progress update.
4. Log a full simulation with three ledger entries in one bucket; the three-times rule appears.
5. Submit a critique, then mark feedback received.
6. Save a Sunday review with pre-filled completion check.
7. Week 8 re-score hides old scores, then shows the comparison.

## 14. Open decisions for the portal owner

1. Does a mentor role exist, and how are mentors assigned to students?
2. Are image uploads supported, and where are files stored? If not, links only for this release.
3. Is recording audio in the portal wanted, or links to recordings made elsewhere?
4. Should students on other programmes (UCEED, CEED) see this tracker? This kit covers NID only.
5. Notifications: none, email, or in-portal reminders for milestones?
