import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: cand } = await supabase.from('exam_candidates').select('id').eq('unique_id', 'TEST-0001').single();
  const { data: testRow } = await supabase.from('exam_tests').select('id').limit(1).single();

  const { data: attempt } = await supabase.from('exam_attempts').upsert({
    candidate_id: cand.id,
    test_id: testRow.id,
    status: 'in_progress'
  }, {onConflict: 'candidate_id,test_id'}).select('id').single();

  if (!attempt) {
    console.log("No attempt created");
    return;
  }

  try {
    const { error: updateErr } = await supabase.from('exam_attempts').update({
      score_part_a: 2.29,
      total_part_a: 10,
      status: 'completed'
    }).eq('id', attempt.id);
    
    if (updateErr) throw updateErr;
  } catch (err) {
    console.log("Caught error:", err.message);
    
    // Fallback update
    const { error: fallbackErr } = await supabase.from('exam_attempts').update({ 
      completed_at: new Date().toISOString(), 
      status: 'completed' 
    }).eq('id', attempt.id);
    
    console.log("Fallback err:", fallbackErr);
    
    const { data: verify } = await supabase.from('exam_attempts').select('*').eq('id', attempt.id).single();
    console.log("Attempt verified:", verify);
  }
}

test();
