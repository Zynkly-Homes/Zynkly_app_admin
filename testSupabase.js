import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const envMap = Object.fromEntries(
  env.split('\n')
  .filter(l => l.trim() && !l.startsWith('#'))
  .map(l => {
     const i = l.indexOf('=');
     return [l.slice(0,i), l.slice(i+1).replace(/"/g, '').trim()];
  })
);

const supabaseUrl = envMap.VITE_SUPABASE_URL;
const supabaseKey = envMap.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


async function testQuery() {
  try {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, scheduled_at, status')
      .limit(5);

    console.log('Bookings:', bookings);
  } catch (err) {
    console.error(err);
  }
}

testQuery();
