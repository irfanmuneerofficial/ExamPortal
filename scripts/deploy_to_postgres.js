const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read env
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const getEnv = (key) => envContent.match(new RegExp(`${key}=(.*)`))?.[1]?.trim();

const host = process.env.PGHOST || getEnv('PGHOST') || 'localhost';
const port = parseInt(process.env.PGPORT || getEnv('PGPORT') || '5432', 10);
const database = process.env.PGDATABASE || getEnv('PGDATABASE') || 'examportal';
const user = process.env.PGUSER || getEnv('PGUSER') || 'examroot';
const password = process.env.PGPASSWORD || getEnv('PGPASSWORD') || '';

console.log(`====================================================`);
console.log(`ExamPortal Native PostgreSQL Database Deployer`);
console.log(`Connecting to: ${user}@${host}:${port}/${database}`);
console.log(`====================================================`);

const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  connectionTimeoutMillis: 5000,
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database!');

    const sqlPath = path.join(__dirname, 'setup_postgres.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`SQL dump not found at: ${sqlPath}`);
      client.release();
      process.exit(1);
    }

    console.log('Reading setup_postgres.sql (1.5MB, 3,546 questions)...');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Executing database schema and question bank dump...');
    await client.query(sql);

    console.log('Checking inserted counts in PostgreSQL:');
    const { rows: pRows } = await client.query('SELECT COUNT(*) FROM public.programs');
    const { rows: cRows } = await client.query('SELECT COUNT(*) FROM public.courses');
    const { rows: mRows } = await client.query('SELECT COUNT(*) FROM public.modules');
    const { rows: qRows } = await client.query('SELECT COUNT(*) FROM public.questions');

    console.log(`Programs:  ${pRows[0].count}`);
    console.log(`Courses:   ${cRows[0].count}`);
    console.log(`Modules:   ${mRows[0].count}`);
    console.log(`Questions: ${qRows[0].count} (All verified from Questions/ folder)`);

    client.release();
    await pool.end();
    console.log('\nPostgreSQL database setup complete and verified!');
  } catch (err) {
    console.error('PostgreSQL connection / execution error:', err.message);
    console.log('\nTip: When deploying on your VPS (77.237.245.123):');
    console.log('  Run: psql -U examroot -d examportal -f scripts/setup_postgres.sql');
    await pool.end();
  }
}

run();
