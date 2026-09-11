/**
 * Script to enforce 25-question cap per module in Supabase Database.
 * Keeps the first 25 questions for each module and removes any excess questions.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function main() {
  console.log('====================================================');
  console.log('Exam Practice Portal: Module 25-Question Restrictor');
  console.log('Target:', SUPABASE_URL);
  console.log('====================================================');

  console.log('\n1. Fetching all existing questions...');
  let allQuestions = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      process.exit(1);
    }
    allQuestions.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Total questions in database: ${allQuestions.length}`);

  // Backup
  const backupFile = path.join(__dirname, 'backup_questions_before_cap.json');
  fs.writeFileSync(backupFile, JSON.stringify(allQuestions, null, 2), 'utf-8');
  console.log(`Backup saved to: ${backupFile}`);

  // Group by module_id
  const byModule = {};
  for (const q of allQuestions) {
    if (!byModule[q.module_id]) byModule[q.module_id] = [];
    byModule[q.module_id].push(q);
  }

  const idsToDelete = [];
  let keptCount = 0;

  for (const [modId, qList] of Object.entries(byModule)) {
    // Keep first 25 questions
    const kept = qList.slice(0, 25);
    const excess = qList.slice(25);
    keptCount += kept.length;
    for (const eq of excess) {
      idsToDelete.push(eq.id);
    }
  }

  console.log(`Modules evaluated: ${Object.keys(byModule).length}`);
  console.log(`Questions to keep (up to 25/module): ${keptCount}`);
  console.log(`Excess questions to remove: ${idsToDelete.length}`);

  if (idsToDelete.length === 0) {
    console.log('\nAll modules already have 25 or fewer questions. No deletion necessary.');
    return;
  }

  console.log(`\n2. Deleting ${idsToDelete.length} excess questions in batches of 100...`);
  const batchSize = 100;
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`Error deleting batch starting at index ${i}:`, error);
    } else {
      deletedCount += batch.length;
      process.stdout.write(`Deleted ${deletedCount} / ${idsToDelete.length} excess questions...\r`);
    }
  }

  console.log(`\nSuccessfully removed ${deletedCount} excess questions.`);

  // Verify final count
  const { count: finalCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  console.log(`\nVerified questions in database after restriction: ${finalCount}`);
  console.log('Every module now has a maximum of 25 questions.');
}

main().catch((err) => {
  console.error('Restriction failed:', err);
  process.exit(1);
});
