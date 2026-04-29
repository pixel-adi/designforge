import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const programs = [
    { name: 'NID B.Des' },
    { name: 'NID M.Des' },
    { name: 'CEED' },
    { name: 'UCEED' }
  ];
  
  for (const p of programs) {
    const { data, error } = await supabase.from('exam_programs').upsert(p, { onConflict: 'name' });
    if (error) console.error("Error inserting", p.name, error);
    else console.log("Inserted", p.name);
  }
}
run();
