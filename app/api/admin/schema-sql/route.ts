import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const supabasePath = path.join(process.cwd(), 'scripts', 'supabase_schema.sql');
    if (fs.existsSync(supabasePath)) {
      const sql = fs.readFileSync(supabasePath, 'utf-8');
      return NextResponse.json({ success: true, sql });
    }
    const postgresPath = path.join(process.cwd(), 'scripts', 'setup_postgres.sql');
    if (fs.existsSync(postgresPath)) {
      const sql = fs.readFileSync(postgresPath, 'utf-8');
      return NextResponse.json({ success: true, sql });
    }
    return NextResponse.json({ success: false, sql: '' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
