import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tbacsyjfbwaqobtmbwdr.supabase.co',
  'sb_publishable_AbmY77fTAaZQqhRzhb4GPA_kYj2mTbx'
);

async function run() {
  const { data } = await supabase.from('exam_tests').select('*');
  console.log(data);
}
run();
