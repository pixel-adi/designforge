---
trigger: always_on
---

# NID DAT 2027 prep tracker: content and accuracy rules

These rules apply to any work that touches the prep tracker: code, copy, seed data, tests or UI text.

## Sources of truth, in order of precedence

1. `prep-tracker-kit/content/plan.ug.json`, `plan.pg.json` and `reference.json`. These were built from the two documents below and are the only curriculum the tracker may show.
2. NID Admissions Handbooks 2027-28 (UG: Integrated M.Des and B.Des; PG: M.Des). Binding for every exam fact, date, rule and discipline name.
3. Designforge Self-Study Outline, Edition 02. Binding for method: the weekly operating system, drills, diagnostic, error ledger, portfolio and articulation guidance.

When the outline and a handbook disagree, the handbook wins. The resolved conflicts are listed in `reference.json > conflictsResolved` and `prep-tracker-kit/SOURCES.md`. Do not reintroduce the outline's side of any of them.

Never invent curriculum, exam facts, dates, seat numbers or weightages. If something is missing, stop and ask the portal owner instead of filling the gap.

## Exam facts you may state

- DAT Prelims: Sunday 20 December 2026, pen-and-paper, same time at every centre, text and visuals, English only.
- Prelims duration: stated on the admit card. Designforge practice papers run three hours. Always label the three hours as practice.
- Prelims score only shortlists for the Mains and is not carried forward.
- Applications: 10 September to 11:59 pm, 30 November 2026. Edit window: 4 pm, 1 December to 11:59 pm, 3 December. Admit cards: 4 pm, 10 December. All times IST.
- Locked after submission, even in the edit window: programme, name, date of birth, registered mobile, registered email.
- Test city can change only during the edit window. 17 cities, listed in `reference.json`.
- UG and PG are examined simultaneously, so a candidate applies for only one.
- UG Mains: Studio Sensitivity Test and In-Person Sensitivity Test. Shortlist: 2.5 times the seats per category.
- PG Mains: Studio Test (group-wise; discipline-wise for Group X) and a separate Interview per discipline. Shortlist: 4.5 times the seats per discipline per category.
- Final merit for both comes from Mains marks, with weightages NID will announce later.
- Prelims results: UG 16 March 2027, PG 16 February 2027.

## Facts you must not state

- No fixed Mains split such as 60:40. NID has not published one.
- No 1.5× shortlisting figure.
- No claims about negative marking, section-wise marks or question counts.
- No claim that a portfolio is required for M.Des Mains. Say "check the Mains notification for portfolio requirements".
- Do not call NID Ahmedabad's undergraduate programme a B.Des. It is the 5.5-year Integrated M.Des. B.Des runs at NID Andhra Pradesh, Madhya Pradesh, Haryana and Assam.
- Do not decide a student's eligibility automatically. Show the handbook reference and link to admissions.nid.edu.

## Banned curriculum

Following the outline's reading of the current pattern, the NID tracks contain no general-ability preparation. Do not add, generate or seed:
- GK quizzes or current-affairs MCQs
- reasoning sets (logical, verbal, analytical, syllogisms, arrangements, coding-decoding)
- English aptitude (comprehension passages, grammar, vocabulary, para jumbles)
- quantitative or data-interpretation drills
- links from tracker tasks to MCQ question banks

Awareness is built through index cards and opinions, not recall. The validator (`node prep-tracker-kit/scripts/validate-content.mjs`) fails on these terms; keep it passing.

## Method invariants

- Week shape, Monday to Sunday: daily drill (45 min) Monday to Saturday; build blocks Monday, Wednesday and Friday (90 min); critique Thursday (60 min); simulation Saturday; Sunday is rest plus a 30-minute written review.
- Four non-negotiables, always shown: daily drill, weekly critique, Sunday review, weekly full simulation.
- Mocks: full simulations start in week 7, or week 4 for the sharpening band. Every full simulation is followed the same day by the 45-minute review protocol.
- Error buckets are exactly: concept, time, clarity, care.
- Diagnostic: six axes scored 1 to 5, total out of 30. Bands: 6–13 foundation, 14–22 standard, 23–30 sharpening. Re-score in week 8 without showing the earlier scores until the new ones are submitted.
- Light tier is about 12 to 15 hours a week; Intensive is about 18 to 22. Do not change minutes without re-running the validator.

## Copy rules

- Plain, warm, direct. Sentence case everywhere. No all-caps labels.
- Name things the way a student would: "Daily drill", "Error ledger", "Sunday review".
- Buttons say what happens: "Mark as done", "Submit for critique", "Save review".
- Never promise a rank, selection or outcome. The outline's position: the plan measures and improves capability; the work is the student's.
- For the foundation band, be honest and kind: this attempt can be calibration. Never shame a low score.
- Empty states invite action ("No simulations logged yet. Your first one is on Saturday 26 September.").
- Dates in Indian format, e.g. "Sat 19 Sep", and all "today" logic in Asia/Kolkata.

## Privacy

Diagnostic scores, diary entries, recordings and error ledgers are personal. Visible to the student, and to assigned mentors only if the portal already has a mentor role with consent. Never public by default.
