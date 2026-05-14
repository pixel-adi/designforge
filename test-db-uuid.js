import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const id = crypto.randomUUID();
  console.log("Using UUID:", id);
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      id: id,
      name: 'Test',
      email: 'test@test.com',
      phone: '1234567890',
      program: 'Focus Batch',
      stage: 'Doing Job',
      payment_status: 'pending',
    });
  
  if (error) {
    console.error("Insert Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success:", data);
  }
}
testInsert();
