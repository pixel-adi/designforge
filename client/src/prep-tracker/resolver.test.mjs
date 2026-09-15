import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load static plan data
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ugPlan = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../prep-tracker-kit/content/plan.ug.json'), 'utf8'));
const pgPlan = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../prep-tracker-kit/content/plan.pg.json'), 'utf8'));

// Import resolver functions
import {
  calculateBand,
  calculateAxes,
  validatePgDisciplines,
  resolveProfile,
  resolveDay,
} from './resolver.ts';

test('Discipline Combination Validation', () => {
  // Valid combinations
  assert.equal(validatePgDisciplines(['Ceramic & Glass Design', 'Product Design']).valid, true); // G4 + G4
  assert.equal(validatePgDisciplines(['Product Design', 'Universal Design']).valid, true); // G4 + GX
  assert.equal(validatePgDisciplines(['Product Design', 'Toy & Game Design', 'Universal Design']).valid, true); // G4 + G4 + GX
  assert.equal(validatePgDisciplines(['Universal Design']).valid, true); // GX alone

  // Invalid combinations
  assert.equal(validatePgDisciplines(['Graphic Design', 'Product Design']).valid, false); // G1 + G4
  assert.equal(validatePgDisciplines(['Universal Design', 'Design Trends and Futures']).valid, false); // GX + GX
  assert.equal(validatePgDisciplines(['Animation Film Design', 'Graphic Design', 'Photography Design']).valid, false); // G1 + G1 + G1
  assert.equal(validatePgDisciplines(['Graphic Design', 'Product Design', 'Universal Design']).valid, false); // G1 + G4 + GX
});

test('Band Calculation and Boundaries', () => {
  assert.equal(calculateBand(6), 'foundation');
  assert.equal(calculateBand(13), 'foundation');
  assert.equal(calculateBand(14), 'standard');
  assert.equal(calculateBand(22), 'standard');
  assert.equal(calculateBand(23), 'sharpening');
  assert.equal(calculateBand(30), 'sharpening');
});

test('Tie Break Order for Weak Axes', () => {
  // If all are 2: tie break order form_material, articulation, observation, drawing, ideation, awareness
  const axes = calculateAxes({
    observation: 2,
    drawing: 2,
    ideation: 2,
    form_material: 2,
    articulation: 2,
    awareness: 2,
  });
  assert.equal(axes.axis1, 'form_material');
  assert.equal(axes.axis2, 'articulation');
});

test('Persona P1: UG, Light, Foundation (Total 12)', () => {
  const profile = resolveProfile({
    track: 'ug',
    tier: 'light',
    diagnostic: {
      observation: 2,
      drawing: 2,
      ideation: 2,
      form_material: 2,
      articulation: 2,
      awareness: 2,
    },
  });

  assert.equal(profile.band, 'foundation');
  assert.equal(profile.total, 12);

  // Day 3 (21 Sep): drill detail mentions "Drawing L0"
  const day3Raw = ugPlan.days.find(d => d.day === 3);
  const day3 = resolveDay(day3Raw, profile);
  const drill = day3.tasks.find(t => t.block === 'drill');
  assert.ok(drill?.detail.includes('Drawing L0'), `Expected drill detail to mention Drawing L0, got: ${drill?.detail}`);

  // Day 29 (17 Oct): simulation title is "Timed brief: theme to storyboard and poster"
  const day29Raw = ugPlan.days.find(d => d.day === 29);
  const day29 = resolveDay(day29Raw, profile);
  const sim = day29.tasks.find(t => t.block === 'simulation');
  assert.equal(sim?.title, 'Timed brief: theme to storyboard and poster');

  // Day 32 (20 Oct): shows optional 45-minute weak-axis block for Form and material
  const day32Raw = ugPlan.days.find(d => d.day === 32);
  const day32 = resolveDay(day32Raw, profile);
  const weakBlock = day32.tasks.find(t => t.block === 'axis_block');
  assert.ok(weakBlock, 'Day 32 must have an axis_block');
  assert.equal(weakBlock.minutes, 45);
  assert.equal(weakBlock.optional, true);
  assert.ok(weakBlock.detail.includes('Form and material'));
});

test('Persona P2: UG, Intensive, Sharpening (Total 25)', () => {
  const profile = resolveProfile({
    track: 'ug',
    tier: 'intensive',
    diagnostic: {
      observation: 4,
      drawing: 4,
      ideation: 5,
      form_material: 3,
      articulation: 4,
      awareness: 5,
    },
  });

  assert.equal(profile.band, 'sharpening');
  assert.equal(profile.total, 25);
  assert.equal(profile.axis1, 'form_material');
  assert.equal(profile.axis2, 'articulation'); // O4, D4, A4 tie broken by articulation

  // Day 3: drill detail mentions "Drawing L1"
  const day3Raw = ugPlan.days.find(d => d.day === 3);
  const day3 = resolveDay(day3Raw, profile);
  const drill = day3.tasks.find(t => t.block === 'drill');
  assert.ok(drill?.detail.includes('Drawing L1'), `Expected Drawing L1, got: ${drill?.detail}`);

  // Day 29: simulation title is "Full simulation: Prelims-style paper"
  const day29Raw = ugPlan.days.find(d => d.day === 29);
  const day29 = resolveDay(day29Raw, profile);
  const sim = day29.tasks.find(t => t.block === 'simulation');
  assert.equal(sim?.title, 'Full simulation: Prelims-style paper');

  // Day 32: shows 90-minute weak-axis block for Form and material
  const day32Raw = ugPlan.days.find(d => d.day === 32);
  const day32 = resolveDay(day32Raw, profile);
  const weakBlock1 = day32.tasks.find(t => t.block === 'axis_block');
  assert.ok(weakBlock1);
  assert.equal(weakBlock1.minutes, 90);
  assert.ok(weakBlock1.detail.includes('Form and material'));

  // Day 34 (22 Oct): 90-minute block for next-lowest axis (Articulation)
  const day34Raw = ugPlan.days.find(d => d.day === 34);
  const day34 = resolveDay(day34Raw, profile);
  const weakBlock2 = day34.tasks.find(t => t.block === 'axis_block');
  assert.ok(weakBlock2);
  assert.equal(weakBlock2.minutes, 90);
  assert.ok(weakBlock2.detail.includes('Articulation'));
});

test('Persona P3: PG, Light, Product + Toy (G4), Standard (Total 18)', () => {
  const profile = resolveProfile({
    track: 'pg',
    tier: 'light',
    disciplines: ['Product Design', 'Toy & Game Design'],
    diagnostic: {
      observation: 3,
      drawing: 3,
      ideation: 3,
      form_material: 3,
      articulation: 3,
      awareness: 3,
    },
  });

  assert.equal(profile.band, 'standard');
  assert.equal(profile.primaryGroup, 'G4');
  assert.equal(profile.hasSecondaryGroupX, false);

  // Day 8 (26 Sep): simulation title is "Timed brief: A torch for a power cut: five concepts, one developed"
  const day8Raw = pgPlan.days.find(d => d.day === 8);
  const day8 = resolveDay(day8Raw, profile);
  const sim = day8.tasks.find(t => t.block === 'simulation');
  assert.equal(sim?.title, 'Timed brief: A torch for a power cut: five concepts, one developed');

  // Day 31 (19 Oct): build detail starts "Teardown: exploded view and failure points of a torch"
  const day31Raw = pgPlan.days.find(d => d.day === 31);
  const day31 = resolveDay(day31Raw, profile);
  const build = day31.tasks.find(t => t.block === 'build');
  assert.ok(build?.detail.startsWith('Teardown: exploded view and failure points of a torch'), `Got: ${build?.detail}`);

  // No Group X exercise on Day 32
  const day32Raw = pgPlan.days.find(d => d.day === 32);
  const day32 = resolveDay(day32Raw, profile);
  const gxExercise = day32.tasks.find(t => t.title.toLowerCase().includes('group x'));
  assert.equal(gxExercise, undefined);
});

test('Persona P4: PG, Intensive, Graphic (G1) + Universal (GX), Sharpening (Total 24)', () => {
  const profile = resolveProfile({
    track: 'pg',
    tier: 'intensive',
    disciplines: ['Graphic Design', 'Universal Design'],
    diagnostic: {
      observation: 4,
      drawing: 4,
      ideation: 4,
      form_material: 4,
      articulation: 4,
      awareness: 4,
    },
  });

  assert.equal(profile.band, 'sharpening');
  assert.equal(profile.primaryGroup, 'G1');
  assert.equal(profile.hasSecondaryGroupX, true);

  // Day 8 simulation title: "Timed brief: Tell a six-frame visual story about a lost object returning"
  const day8Raw = pgPlan.days.find(d => d.day === 8);
  const day8 = resolveDay(day8Raw, profile);
  const sim = day8.tasks.find(t => t.block === 'simulation');
  assert.equal(sim?.title, 'Timed brief: Tell a six-frame visual story about a lost object returning');

  // Day 32 shows the optional Group X exercise
  const day32Raw = pgPlan.days.find(d => d.day === 32);
  const day32 = resolveDay(day32Raw, profile);
  const gxTask = day32.tasks.find(t => t.title === 'Group X exercise');
  assert.ok(gxTask, 'Expected Group X exercise task on Day 32');
  assert.equal(gxTask.optional, true);

  // Day 58 (15 Nov): shows "Re-score your diagnostic"
  const day58Raw = pgPlan.days.find(d => d.day === 58);
  const day58 = resolveDay(day58Raw, profile);
  const rescore = day58.tasks.find(t => t.title === 'Re-score your diagnostic');
  assert.ok(rescore, 'Expected Re-score your diagnostic on Day 58');
});
