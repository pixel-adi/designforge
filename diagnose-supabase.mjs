#!/usr/bin/env node
/**
 * Comprehensive Supabase Diagnostic — Round 2
 * Tests every table the portal and admin query on load.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tbacsyjfbwaqobtmbwdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiYWNzeWpmYndhcW9idG1id2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDEyMDIsImV4cCI6MjA4OTQ3NzIwMn0.wdip8KYSTChjjjUgeIjydHaOhb_m2qF52VJQzMSSQvo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test(label, fn) {
  try {
    const start = Date.now();
    const result = await fn();
    const ms = Date.now() - start;
    if (result.error) {
      const code = result.error.code || '';
      const msg = result.error.message || '';
      const isPerm = code === '42501' || msg.includes('permission denied');
      console.log(`❌ ${label}: ${isPerm ? 'PERMISSION DENIED — ' : ''}${msg} [${code}] (${ms}ms)`);
      return false;
    }
    const count = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0);
    console.log(`✅ ${label}: ${count} rows (${ms}ms)`);
    return true;
  } catch (e) {
    console.log(`❌ ${label}: CRASH — ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Round 2 Diagnostics — Checking all tables used during load\n');

  // 1. Check if is_admin() RPC still fails (should be fixed after hotfix)
  console.log('── RPC Functions ──');
  await test('public.is_admin() RPC', () => supabase.rpc('is_admin'));
  // Try private.is_admin via a simple query that uses it
  
  console.log('\n── Portal Load Path ──');
  // These are ALL queries the portal dashboard makes during initialization
  await test('exam_candidates (SELECT)', () =>
    supabase.from('exam_candidates').select('id, name, email').limit(1));
  await test('exam_programs (SELECT)', () =>
    supabase.from('exam_programs').select('id, name').limit(5));
  await test('exam_tests (SELECT published)', () =>
    supabase.from('exam_tests').select('id, title, status').eq('status', 'published').limit(3));
  await test('exam_test_sections (SELECT)', () =>
    supabase.from('exam_test_sections').select('id, part').limit(3));
  await test('exam_attempts (SELECT)', () =>
    supabase.from('exam_attempts').select('id, status').limit(3));
  await test('exam_responses (SELECT)', () =>
    supabase.from('exam_responses').select('id').limit(3));
  await test('exam_questions (SELECT)', () =>
    supabase.from('exam_questions').select('id, type').limit(3));
  await test('exam_options (SELECT)', () =>
    supabase.from('exam_options').select('id').limit(3));
  await test('exam_feature_requests (SELECT)', () =>
    supabase.from('exam_feature_requests').select('id').limit(3));
  
  console.log('\n── Prep Tracker Path ──');
  await test('prep_enrolments (SELECT)', () =>
    supabase.from('prep_enrolments').select('id').limit(3));
  await test('prep_task_completions (SELECT)', () =>
    supabase.from('prep_task_completions').select('task_id').limit(3));
  await test('prep_diagnostic_scores (SELECT)', () =>
    supabase.from('prep_diagnostic_scores').select('id').limit(3));
  await test('prep_exam_plans (SELECT)', () =>
    supabase.from('prep_exam_plans').select('id').limit(3));
  await test('prep_simulation_logs (SELECT)', () =>
    supabase.from('prep_simulation_logs').select('id').limit(3));
  await test('prep_error_ledger_entries (SELECT)', () =>
    supabase.from('prep_error_ledger_entries').select('id').limit(3));
  
  console.log('\n── Admin Path ──');
  await test('staff_users (SELECT)', () =>
    supabase.from('staff_users').select('id, role').limit(3));
  await test('registrations (SELECT)', () =>
    supabase.from('registrations').select('id').limit(3));
  await test('subscribers (SELECT count)', () =>
    supabase.from('subscribers').select('*', { count: 'exact', head: true }));
  await test('study_materials (SELECT)', () =>
    supabase.from('study_materials').select('id').limit(3));
  await test('class_assignments (SELECT)', () =>
    supabase.from('class_assignments').select('id').limit(3));
  await test('system_settings (SELECT)', () =>
    supabase.from('system_settings').select('*').limit(3));

  console.log('\n── Additional Tables ──');
  // Check tables that might have RLS with is_admin() references
  await test('exam_test_questions (SELECT)', () =>
    supabase.from('exam_test_questions').select('question_id').limit(3));
  await test('assignment_submissions (SELECT)', () =>
    supabase.from('assignment_submissions').select('id').limit(3));

  // Check for any Supabase project-level issues
  console.log('\n── Connectivity ──');
  try {
    const start = Date.now();
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/exam_candidates?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    const ms = Date.now() - start;
    const body = await resp.text();
    console.log(`${resp.ok ? '✅' : '❌'} Direct REST fetch: ${resp.status} (${ms}ms) — ${body.substring(0, 100)}`);
  } catch (e) {
    console.log(`❌ Direct REST fetch: ${e.message}`);
  }

  // Check auth endpoint
  try {
    const start = Date.now();
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { 'apikey': SUPABASE_ANON_KEY },
    });
    const ms = Date.now() - start;
    console.log(`${resp.ok ? '✅' : '❌'} Auth endpoint: ${resp.status} (${ms}ms)`);
  } catch (e) {
    console.log(`❌ Auth endpoint: ${e.message}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('Done. Any ❌ above is a potential cause of the outage.');
  console.log('');
}

main().catch(e => {
  console.error('Script crashed:', e);
  process.exit(1);
});
