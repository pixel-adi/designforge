import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tbacsyjfbwaqobtmbwdr.supabase.co',
  'sb_publishable_AbmY77fTAaZQqhRzhb4GPA_kYj2mTbx'
);

async function run() {
  const id = 'fe827799-022e-4ef3-92a6-38e4a4d50000';
  console.log("Fetching test with id:", id);
  const { data: testData, error: testErr } = await supabase.from('exam_tests').select('*, exam_programs(name)').eq('id', id).single();
  console.log("Test fetch error:", testErr);
  
  const { data: sectionsData, error: secErr } = await supabase.from('exam_test_sections').select('*').eq('test_id', id);
  console.log("Sections error:", secErr);

  const { data: tqData, error: tqErr } = await supabase.from('exam_test_questions').select('question_id').eq('test_id', id);
  console.log("Test Questions error:", tqErr);

  const questionIds = tqData?.map(t => t.question_id) || [];
  console.log("QIDs length:", questionIds.length);

  const { data: qData, error: qErr } = await supabase.from('exam_questions').select('*').in('id', questionIds);
  console.log("Questions error:", qErr);

  const { data: optData, error: optErr } = await supabase.from('exam_options').select('id, question_id, content_text, media_url').in('question_id', questionIds);
  console.log("Options error:", optErr);
}
run();
