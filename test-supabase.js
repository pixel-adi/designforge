import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function testInsert() {
  const { data, error } = await supabase.from('programs').upsert({
    id: crypto.randomUUID(),
    name: 'Test Program',
    description: 'Test',
    price: 100,
    duration: '1 week',
    start_date: new Date().toISOString(),
    is_active: true,
    display_order: 1
  })
  console.log('Programs Upsert Error:', error)
  
  const { data: wData, error: wError } = await supabase.from('workshops').upsert({
    id: crypto.randomUUID(),
    title: 'Test Workshop',
    description: 'Test',
    date: new Date().toISOString(),
    duration: '1 hour',
    location: 'Zoom',
    status: 'upcoming',
    is_featured: false,
    display_order: 1,
    is_visible: true
  })
  console.log('Workshops Upsert Error:', wError)
}

testInsert()
