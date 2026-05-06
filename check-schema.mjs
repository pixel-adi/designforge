import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_column_types');
  if (error) {
     // fallback: try to insert 1.5 into score_part_a and see the error
     const { error: insErr } = await supabase.from('exam_attempts').update({score_part_a: 1.5}).eq('id', '00000000-0000-0000-0000-000000000000');
     console.log("Error inserting 1.5:", insErr);
  } else {
     console.log("Column types:", data);
  }
}

check();
