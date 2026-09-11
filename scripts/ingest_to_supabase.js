const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate deterministic UUID v5 from a string
function stringToUuid(str) {
  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const SUPABASE_URL = process.env.SUPABASE_URL || getEnv('NEXT_PUBLIC_SUPABASE_URL') || '';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || getEnv('SUPABASE_SECRET_KEY') || '';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log('====================================================');
  console.log('ExamPortal Supabase Cloud Data Ingester');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log('====================================================\n');

  // 1. Check connection
  const { error: testErr } = await sb.from('programs').select('count', { count: 'exact', head: true });
  if (testErr) {
    console.error('❌ Could not access programs table in Supabase:', testErr.message);
    process.exit(1);
  }
  console.log('✓ Connected to Supabase and tables are verified.\n');

  // 2. Read parsed curriculum
  const jsonPath = path.join(__dirname, 'parsed_curriculum_questions.json');
  console.log(`Reading parsed curriculum questions from ${jsonPath}...`);
  const curriculum = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${curriculum.length} courses from curriculum JSON.\n`);

  // 3. Upsert Programs
  console.log('1/4. Upserting Programs (ACCP AI & ACCP PRO)...');
  const programsData = [
    {
      id: '19843784-d0b0-466c-8168-b1fe6adbdd46',
      name: 'ACCP AI',
      description: 'Aptech Certified Computer Professional - Artificial Intelligence & Data Science track spanning Semesters 1 to 6.',
    },
    {
      id: '95d4a391-7752-4e85-83e1-ac4e1908aaa5',
      name: 'ACCP PRO',
      description: 'Aptech Certified Computer Professional - Professional Software Engineering track spanning Semesters 1 to 6.',
    },
  ];

  const { error: progErr } = await sb.from('programs').upsert(programsData, { onConflict: 'id' });
  if (progErr) throw new Error(`Programs upsert failed: ${progErr.message}`);
  console.log('✓ Programs upserted successfully.\n');

  const progId = '19843784-d0b0-466c-8168-b1fe6adbdd46'; // ACCP AI

  // 4. Flatten courses, modules, and questions
  const coursesToUpsert = [];
  const modulesToUpsert = [];
  const questionsToUpsert = [];

  for (const c of curriculum) {
    const courseId = stringToUuid(`course_${c.course_code}`);
    coursesToUpsert.push({
      id: courseId,
      program_id: progId,
      name: c.course_name,
      code: c.course_code,
      semester: c.semester,
    });

    for (const m of c.modules) {
      const moduleId = stringToUuid(`mod_${c.course_code}_${m.module_number}`);
      modulesToUpsert.push({
        id: moduleId,
        course_id: courseId,
        title: m.title,
        module_number: m.module_number,
      });

      for (const q of m.questions) {
        const questionId = crypto.randomUUID();
        questionsToUpsert.push({
          id: questionId,
          module_id: moduleId,
          question_text: q.question_text,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || `The verified correct answer is: ${q.correct_answer}`,
        });
      }
    }
  }

  // 5. Upsert Courses
  console.log(`2/4. Upserting ${coursesToUpsert.length} Courses under ACCP AI...`);
  const { error: courseErr } = await sb.from('courses').upsert(coursesToUpsert, { onConflict: 'id' });
  if (courseErr) throw new Error(`Courses upsert failed: ${courseErr.message}`);
  console.log(`✓ ${coursesToUpsert.length} Courses upserted successfully.\n`);

  // 6. Upsert Modules
  console.log(`3/4. Upserting ${modulesToUpsert.length} Modules...`);
  const { error: modErr } = await sb.from('modules').upsert(modulesToUpsert, { onConflict: 'id' });
  if (modErr) throw new Error(`Modules upsert failed: ${modErr.message}`);
  console.log(`✓ ${modulesToUpsert.length} Modules upserted successfully.\n`);

  // 7. Clear and Upload Questions in batches of 100
  console.log(`4/4. Ingesting ${questionsToUpsert.length} Questions into Supabase in batches of 100...`);
  
  // Wipe existing questions to ensure clean state
  await sb.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const BATCH_SIZE = 100;
  let uploaded = 0;
  for (let i = 0; i < questionsToUpsert.length; i += BATCH_SIZE) {
    const batch = questionsToUpsert.slice(i, i + BATCH_SIZE);
    const { error: qErr } = await sb.from('questions').insert(batch);
    if (qErr) {
      console.error(`\nBatch ${i} - ${i + batch.length} failed:`, qErr.message);
      throw qErr;
    }
    uploaded += batch.length;
    process.stdout.write(`  Uploaded ${uploaded} / ${questionsToUpsert.length} questions (${Math.round((uploaded / questionsToUpsert.length) * 100)}%)...\r`);
  }

  console.log('\n\n====================================================');
  console.log(`🎉 SUCCESS! Migration Complete!`);
  console.log(`- Target Database: ${SUPABASE_URL}`);
  console.log(`- Programs:  2 (ACCP AI & ACCP PRO)`);
  console.log(`- Courses:   ${coursesToUpsert.length} (Semesters 1 to 4)`);
  console.log(`- Modules:   ${modulesToUpsert.length}`);
  console.log(`- Questions: ${uploaded} Real MCQs`);
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\nIngestion failed:', err.message);
  process.exit(1);
});
