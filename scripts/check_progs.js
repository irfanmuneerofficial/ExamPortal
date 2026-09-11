const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const key = env.match(/SUPABASE_SECRET_KEY=(.*)/)?.[1]?.trim() || '';

const sb = createClient(url, key);

async function check() {
  console.log(`Checking Supabase database at: ${url}`);
  const { data: progs, error } = await sb.from('programs').select('*');
  if (error) {
    console.error('Error fetching programs (tables may not exist yet):', error.message);
    return;
  }
  console.log(`Found ${progs.length} programs in database:`);
  for (const p of progs) {
    const { count } = await sb.from('courses').select('id', { count: 'exact', head: true }).eq('program_id', p.id);
    console.log(` - ${p.name} (ID: ${p.id}): ${count || 0} courses`);
  }

  const { count: qCount } = await sb.from('questions').select('id', { count: 'exact', head: true });
  console.log(`Total questions in Supabase: ${qCount || 0}`);
}

check().catch(console.error);
