#!/usr/bin/env node
// Validates prep-tracker content. No dependencies. Usage: node validate-content.mjs <contentDir>
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] || new URL("../content", import.meta.url).pathname;
const errors = [];
const warn = [];
const fail = (m) => errors.push(m);

const START = "2026-09-19", END = "2026-12-19", EXAM = "2026-12-20";
const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const BLOCKS = new Set(["drill","build","critique","simulation","simulation_review","sunday_review","field_mission","axis_block","awareness_card","making_drill","articulation","redo","mock_conversation","admin","diagnostic"]);
const MODULES = new Set(["observation","drawing","ideation","form_material","articulation","awareness","domain","portfolio","simulation","strategy","admin"]);
const CAPTURES = new Set(["diagnostic","diaryEntry","explanationCard","buildPhoto","reviewSubmission","simulationLog","errorLedger","sundayReview","awarenessCard","pitchRecording","mockConversation","disciplineChoice"]);
const GROUPS = ["G1","G2","G3","G4","G5","GX"];
const MILESTONES = { "2026-10-03": "Submit your application", "2026-11-30": "Applications close", "2026-12-01": "Edit window", "2026-12-10": "Admit cards" };

// NID tracks: the Prelims no longer has a general-ability section (Designforge outline §01),
// and these figures conflict with or are not confirmed by the 2027-28 handbooks.
const BANNED = [
  [/\bGAT\b/, "GAT prep (removed from NID Prelims)"],
  [/general (ability|mental ability|knowledge quiz)/i, "general-ability drills"],
  [/quantitative|arithmetic|profit and loss|time and work/i, "quantitative drills"],
  [/(logical|verbal|analytical) reasoning|syllogism|blood relation|coding.decoding|seating arrangement/i, "reasoning MCQ drills"],
  [/reading comprehension|para jumble|error spotting|synonym/i, "English aptitude drills"],
  [/\bMCQ\b/, "MCQ drills"],
  [/1\.5\s*[×x]/, "1.5× shortlisting (handbook says 2.5× UG, 4.5× PG)"],
  [/60\s*:\s*40/, "60:40 Mains weighting (handbook: announced later)"],
  [/negative marking/i, "negative-marking claim (not in handbook)"],
];

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };

function textOf(t) {
  const parts = [t.title, t.detail];
  (t.variants || []).forEach((v) => parts.push(v.title, v.detail));
  Object.values(t.byGroup || {}).forEach((v) => parts.push(v.title, v.detail));
  return parts.filter(Boolean).join(" \n ");
}

function checkPlan(file) {
  const p = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const tag = p.track;
  if (p.startDate !== START || p.endDate !== END || p.examDate !== EXAM) fail(`${tag}: plan dates must be ${START} to ${END}, exam ${EXAM}`);
  if (p.days.length !== 92) fail(`${tag}: expected 92 days, got ${p.days.length}`);
  const ids = new Set();
  const weekly = {};
  p.days.forEach((d, i) => {
    const expect = addDays(START, i);
    if (d.date !== expect) fail(`${tag} day ${d.day}: date ${d.date} should be ${expect}`);
    const wd = WEEKDAYS[new Date(d.date + "T00:00:00Z").getUTCDay()];
    if (d.weekday !== wd) fail(`${tag} ${d.date}: weekday ${d.weekday} should be ${wd}`);
    if (!p.phases.some((ph) => ph.id === d.phaseId)) fail(`${tag} ${d.date}: unknown phase ${d.phaseId}`);
    if (!d.tasks.length) fail(`${tag} ${d.date}: no tasks`);
    if (MILESTONES[d.date] && !d.tasks.some((t) => t.kind === "milestone" && t.title.includes(MILESTONES[d.date]))) fail(`${tag} ${d.date}: missing milestone '${MILESTONES[d.date]}'`);
    if (d.weekday === "Sunday" && d.week >= 1 && d.week <= 12 && d.tasks.some((t) => t.block === "drill")) fail(`${tag} ${d.date}: Sunday is rest; no daily drill`);
    if (["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].includes(d.weekday) && d.week >= 1 && d.week <= 12 && !d.tasks.some((t) => t.block === "drill")) fail(`${tag} ${d.date}: missing daily drill`);
    d.tasks.forEach((t) => {
      if (ids.has(t.id)) fail(`${tag}: duplicate id ${t.id}`); ids.add(t.id);
      if (!BLOCKS.has(t.block)) fail(`${t.id}: unknown block ${t.block}`);
      if (!MODULES.has(t.module)) fail(`${t.id}: unknown module ${t.module}`);
      (t.capture || []).forEach((c) => CAPTURES.has(c) || fail(`${t.id}: unknown capture ${c}`));
      const { light, intensive } = t.minutes || {};
      if (light == null && intensive == null) fail(`${t.id}: in no tier`);
      [light, intensive].forEach((m) => { if (m != null && (!Number.isInteger(m) || m <= 0)) fail(`${t.id}: bad minutes ${m}`); });
      if (t.byGroup) GROUPS.forEach((g) => t.byGroup[g] || fail(`${t.id}: byGroup missing ${g}`));
      if (!t.title && !t.byGroup) fail(`${t.id}: missing title`);
      if (!t.source || !t.source.length) fail(`${t.id}: missing source reference`);
      const txt = textOf(t);
      BANNED.forEach(([re, why]) => { if (re.test(txt)) fail(`${t.id}: banned content: ${why}`); });
      // weekly load, default path (no variants, optional excluded)
      if (d.week >= 1 && d.week <= 12) {
        weekly[d.week] ??= { light: 0, intensive: 0 };
        for (const tier of ["light", "intensive"]) {
          if (t.minutes[tier] != null && !(t.optional && t.optional[tier])) weekly[d.week][tier] += t.minutes[tier];
        }
      }
    });
  });
  const rows = Object.entries(weekly).map(([w, v]) => ({ w: +w, light: +(v.light / 60).toFixed(1), intensive: +(v.intensive / 60).toFixed(1) }));
  rows.forEach((r) => {
    if (r.light < 11 || r.light > 15.5) fail(`${tag} week ${r.w}: light plan is ${r.light} h (outline range 12 to 15)`);
    if (r.intensive < 17 || r.intensive > 23) fail(`${tag} week ${r.w}: intensive plan is ${r.intensive} h`);
  });
  const sims = p.days.flatMap((d) => d.tasks.filter((t) => t.kind === "simulation" && /^Full simulation/.test(t.title)).map(() => d.date));
  console.log(`\n${file}: ${p.days.length} days, ${ids.size} tasks, ${sims.length} full simulations (${sims[0]} to ${sims.at(-1)})`);
  console.table(rows);
  return p;
}

function checkReference() {
  const r = JSON.parse(readFileSync(join(dir, "reference.json"), "utf8"));
  if (r.diagnostic.axes.length !== 6) fail("reference: diagnostic needs six axes");
  const b = r.diagnostic.bands.map((x) => [x.min, x.max]).flat().join(",");
  if (b !== "6,13,14,22,23,30") fail(`reference: diagnostic bands should be 6-13, 14-22, 23-30 (got ${b})`);
  if (r.exam.ug.mainsShortlistMultiple !== 2.5) fail("reference: UG shortlist multiple must be 2.5 (handbook UG §2.1)");
  if (r.exam.pg.mainsShortlistMultiple !== 4.5) fail("reference: PG shortlist multiple must be 4.5 (handbook PG §9.3)");
  const groups = Object.keys(r.disciplines.pg.groups);
  if (groups.join() !== GROUPS.join()) fail("reference: PG groups must be G1..G5, GX");
  if (r.errorBuckets.map((x) => x.id).join() !== "concept,time,clarity,care") fail("reference: error buckets must be concept, time, clarity, care");
}

checkPlan("plan.ug.json");
checkPlan("plan.pg.json");
checkReference();
if (warn.length) console.warn("\nWarnings:\n" + warn.join("\n"));
if (errors.length) { console.error(`\n${errors.length} error(s):\n` + errors.slice(0, 60).join("\n")); process.exit(1); }
console.log("\nAll content checks passed.");
