import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  const { error } = await supabase
    .from('registrations')
    .insert({
      id: crypto.randomUUID(),
      name: 'Test Phone',
      email: 'testphone@test.com',
      phone: '+91 98765 43210',
      program: 'Focus Batch',
      stage: 'Doing Job',
      payment_status: 'pending',
    });
  console.log(error ? "Error: " + error.message : "Success");
}
testInsert();
