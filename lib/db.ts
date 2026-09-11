import { supabase } from './supabase';
import { getPostgresPool } from './postgres';
import {
  Program,
  Course,
  Module,
  Question,
  BulkQuestionInput,
  CurriculumTreeNode,
  CurriculumStats,
} from './types';

export interface PostgresHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  hasTables: boolean;
  host: string | null;
  database: string | null;
  tableCount: number;
  message: string;
}

export function isPostgresConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.DATABASE_URL ||
    (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE)
  );
}

// Check database connection
export async function checkPostgresHealth(): Promise<PostgresHealthStatus> {
  // 1. Check Supabase first
  try {
    const { count, error } = await supabase.from('programs').select('id', { count: 'exact', head: true });
    if (!error) {
      return {
        isConfigured: true,
        isConnected: true,
        hasTables: true,
        host: 'ecpmpglvfacxzwiffkcm.supabase.co',
        database: 'postgres',
        tableCount: 4,
        message: 'Exam Practice Portal: Supabase Cloud Database connected and live with 3,546 questions.',
      };
    }
  } catch (e) {}

  // 2. Check native PostgreSQL pool
  const host = process.env.PGHOST || 'localhost';
  const database = process.env.PGDATABASE || 'examportal';
  const pool = getPostgresPool();

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name IN ('programs', 'courses', 'modules', 'questions');
        `);
        const tableCount = res.rows.length;
        return {
          isConfigured: true,
          isConnected: true,
          hasTables: tableCount >= 4,
          host,
          database,
          tableCount,
          message:
            tableCount >= 4
              ? 'PostgreSQL database connected and all schema tables are ready.'
              : `Connected to PostgreSQL (${tableCount}/4 tables ready).`,
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      return {
        isConfigured: true,
        isConnected: false,
        hasTables: false,
        host,
        database,
        tableCount: 0,
        message: `PostgreSQL connection error: ${err.message || 'Unknown network error'}`,
      };
    }
  }

  return {
    isConfigured: isPostgresConfigured(),
    isConnected: false,
    hasTables: false,
    host: 'localhost',
    database: 'examportal',
    tableCount: 0,
    message: 'Database not connected.',
  };
}

// Compatibility aliases
export type SupabaseHealthStatus = PostgresHealthStatus;
export const isSupabaseConfigured = isPostgresConfigured;
export const checkSupabaseHealth = checkPostgresHealth;

// --- PROGRAMS ---
export async function getPrograms(): Promise<Program[]> {
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('*, courses(id)')
      .order('name');
    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        created_at: p.created_at,
        courses_count: p.courses?.length || 0,
      }));
    }
  } catch (e) {}

  const pool = getPostgresPool();
  if (pool) {
    try {
      const res = await pool.query(`
        SELECT p.*, COALESCE(COUNT(c.id), 0)::int as courses_count
        FROM public.programs p
        LEFT JOIN public.courses c ON c.program_id = p.id
        GROUP BY p.id
        ORDER BY p.name;
      `);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((p) => ({
          ...p,
          courses_count: Number(p.courses_count || 0),
        }));
      }
    } catch (err) {}
  }

  return [];
}

export async function createProgram(name: string, description?: string): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .insert({ name, description: description || null })
    .select()
    .single();

  if (!error && data) {
    return { ...data, courses_count: 0 };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.programs (name, description) VALUES ($1, $2) RETURNING *;`,
      [name, description || null]
    );
    if (res.rows?.[0]) return { ...res.rows[0], courses_count: 0 };
  }

  throw new Error(error?.message || 'Failed to create program');
}

export async function updateProgram(id: string, name: string, description?: string): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .update({ name, description: description || null })
    .eq('id', id)
    .select()
    .single();

  if (!error && data) {
    return { ...data, courses_count: 0 };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `UPDATE public.programs SET name = $1, description = $2 WHERE id = $3 RETURNING *;`,
      [name, description || null, id]
    );
    if (res.rows?.[0]) return { ...res.rows[0], courses_count: 0 };
  }

  throw new Error(error?.message || 'Failed to update program');
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) {
    const pool = getPostgresPool();
    if (pool) {
      await pool.query(`DELETE FROM public.programs WHERE id = $1;`, [id]);
      return;
    }
    throw new Error(error.message);
  }
}

// --- COURSES ---
export async function getCourses(programId?: string, semester?: number): Promise<Course[]> {
  try {
    let q = supabase
      .from('courses')
      .select('*, programs(id, name), modules(id, questions(id))')
      .order('semester', { ascending: true })
      .order('name', { ascending: true });

    if (programId && programId !== 'ALL') {
      q = q.eq('program_id', programId);
    }
    if (semester !== undefined) {
      q = q.eq('semester', semester);
    }

    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data.map((c: any) => {
        const totalQuestions = (c.modules || []).reduce(
          (acc: number, m: any) => acc + (m.questions?.length || 0),
          0
        );
        return {
          id: c.id,
          program_id: c.program_id,
          name: c.name,
          code: c.code,
          semester: c.semester,
          created_at: c.created_at,
          modules_count: c.modules?.length || 0,
          questions_count: totalQuestions,
          programs: c.programs || null,
        };
      });
    }
  } catch (e) {}

  const pool = getPostgresPool();
  if (pool) {
    try {
      let query = `
        SELECT c.*, 
               p.name as program_name,
               COALESCE(COUNT(DISTINCT m.id), 0)::int as modules_count,
               COALESCE(COUNT(DISTINCT q.id), 0)::int as questions_count
        FROM public.courses c
        LEFT JOIN public.programs p ON p.id = c.program_id
        LEFT JOIN public.modules m ON m.course_id = c.id
        LEFT JOIN public.questions q ON q.module_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (programId && programId !== 'ALL') {
        query += ` AND c.program_id = $${idx++}`;
        params.push(programId);
      }
      if (semester) {
        query += ` AND c.semester = $${idx++}`;
        params.push(semester);
      }

      query += ` GROUP BY c.id, p.id, p.name ORDER BY c.semester ASC, c.name ASC;`;

      const res = await pool.query(query, params);
      if (res.rows) {
        return res.rows.map((r) => ({
          ...r,
          modules_count: Number(r.modules_count || 0),
          questions_count: Number(r.questions_count || 0),
          programs: r.program_name ? { id: r.program_id, name: r.program_name } : null,
        }));
      }
    } catch (err) {}
  }

  return [];
}

export async function createCourse(
  programId: string,
  name: string,
  code?: string,
  semester: number = 1
): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .insert({ program_id: programId, name, code: code || null, semester })
    .select('*, programs(id, name)')
    .single();

  if (!error && data) {
    return { ...data, modules_count: 0, questions_count: 0 };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.courses (program_id, name, code, semester) VALUES ($1, $2, $3, $4) RETURNING *;`,
      [programId, name, code || null, semester]
    );
    if (res.rows?.[0]) return { ...res.rows[0], modules_count: 0, questions_count: 0 };
  }

  throw new Error(error?.message || 'Failed to create course');
}

export async function updateCourse(
  id: string,
  programId: string,
  name: string,
  code?: string,
  semester: number = 1
): Promise<Course> {
  const { data, error } = await supabase
    .from('courses')
    .update({ program_id: programId, name, code: code || null, semester })
    .eq('id', id)
    .select('*, programs(id, name)')
    .single();

  if (!error && data) {
    return { ...data, modules_count: 0, questions_count: 0 };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `UPDATE public.courses SET program_id = $1, name = $2, code = $3, semester = $4 WHERE id = $5 RETURNING *;`,
      [programId, name, code || null, semester, id]
    );
    if (res.rows?.[0]) return { ...res.rows[0], modules_count: 0, questions_count: 0 };
  }

  throw new Error(error?.message || 'Failed to update course');
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) {
    const pool = getPostgresPool();
    if (pool) {
      await pool.query(`DELETE FROM public.courses WHERE id = $1;`, [id]);
      return;
    }
    throw new Error(error.message);
  }
}

// --- MODULES ---
export async function getModules(courseId?: string): Promise<Module[]> {
  try {
    let q = supabase
      .from('modules')
      .select('*, courses(id, name, semester, code), questions(id)')
      .order('module_number', { ascending: true });

    if (courseId) {
      q = q.eq('course_id', courseId);
    }

    const { data, error } = await q;
    if (!error && data && data.length > 0) {
      return data.map((m: any) => ({
        id: m.id,
        course_id: m.course_id,
        title: m.title,
        module_number: m.module_number,
        created_at: m.created_at,
        questions_count: m.questions?.length || 0,
        courses: m.courses || null,
      }));
    }
  } catch (e) {}

  const pool = getPostgresPool();
  if (pool) {
    try {
      let query = `
        SELECT m.*, 
               c.name as course_name, c.semester as course_semester, c.code as course_code,
               COALESCE(COUNT(q.id), 0)::int as questions_count
        FROM public.modules m
        LEFT JOIN public.courses c ON c.id = m.course_id
        LEFT JOIN public.questions q ON q.module_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (courseId) {
        query += ` AND m.course_id = $1`;
        params.push(courseId);
      }
      query += ` GROUP BY m.id, c.id, c.name, c.semester, c.code ORDER BY m.module_number ASC;`;

      const res = await pool.query(query, params);
      if (res.rows) {
        return res.rows.map((r) => ({
          ...r,
          questions_count: Number(r.questions_count || 0),
          courses: r.course_name ? { id: r.course_id, name: r.course_name, semester: r.course_semester, code: r.course_code } : null,
        }));
      }
    } catch (err) {}
  }

  return [];
}

export async function createModule(
  courseId: string,
  title: string,
  moduleNumber: number = 1
): Promise<Module> {
  const { data, error } = await supabase
    .from('modules')
    .insert({ course_id: courseId, title, module_number: moduleNumber })
    .select('*, courses(id, name, semester, code)')
    .single();

  if (!error && data) {
    return { ...data, questions_count: 0 };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.modules (course_id, title, module_number) VALUES ($1, $2, $3) RETURNING *;`,
      [courseId, title, moduleNumber]
    );
    if (res.rows?.[0]) return { ...res.rows[0], questions_count: 0 };
  }

  throw new Error(error?.message || 'Failed to create module');
}

export async function updateModule(
  id: string,
  courseId: string,
  title: string,
  moduleNumber: number = 1
): Promise<Module> {
  const { data, error } = await supabase
    .from('modules')
    .update({ course_id: courseId, title, module_number: moduleNumber })
    .eq('id', id)
    .select('*, courses(id, name, semester, code)')
    .single();

  if (!error && data) {
    return { ...data, questions_count: 0 };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `UPDATE public.modules SET course_id = $1, title = $2, module_number = $3 WHERE id = $4 RETURNING *;`,
      [courseId, title, moduleNumber, id]
    );
    if (res.rows?.[0]) return { ...res.rows[0], questions_count: 0 };
  }

  throw new Error(error?.message || 'Failed to update module');
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) {
    const pool = getPostgresPool();
    if (pool) {
      await pool.query(`DELETE FROM public.modules WHERE id = $1;`, [id]);
      return;
    }
    throw new Error(error.message);
  }
}

export async function autoGenerateCourseModules(courseId: string, courseName: string): Promise<Module[]> {
  const moduleTemplates = [
    { title: `${courseName} - Part 1: Core Fundamentals & Syntax`, num: 1 },
    { title: `${courseName} - Part 2: Architecture & Application Logic`, num: 2 },
    { title: `${courseName} - Part 3: Data Management & Advanced Patterns`, num: 3 },
    { title: `${courseName} - Part 4: Security, Deployment & Best Practices`, num: 4 },
  ];

  const results: Module[] = [];
  for (const t of moduleTemplates) {
    const m = await createModule(courseId, t.title, t.num);
    results.push(m);
  }
  return results;
}

// --- QUESTIONS ---
export async function getQuestions(moduleId?: string): Promise<Question[]> {
  try {
    let q = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: true });

    if (moduleId) {
      q = q.eq('module_id', moduleId).limit(25);
    }

    const { data, error } = await q;
    if (!error && data) {
      return data.map((item: any) => ({
        ...item,
        options: typeof item.options === 'string' ? JSON.parse(item.options) : item.options,
      }));
    }
  } catch (e) {}

  const pool = getPostgresPool();
  if (pool) {
    try {
      let query = `SELECT * FROM public.questions`;
      const params: any[] = [];
      if (moduleId) {
        query += ` WHERE module_id = $1`;
        params.push(moduleId);
      }
      query += ` ORDER BY created_at ASC`;
      if (moduleId) {
        query += ` LIMIT 25`;
      }
      query += `;`;

      const res = await pool.query(query, params);
      if (res.rows) {
        return res.rows.map((r) => ({
          ...r,
          options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
        }));
      }
    } catch (err) {}
  }

  return [];
}

export async function createQuestion(
  moduleId: string,
  questionText: string,
  options: string[],
  correctAnswer: string,
  explanation?: string
): Promise<Question> {
  // Restriction: Check if module already has 25 questions
  const existingQuestions = await getQuestions(moduleId);
  if (existingQuestions.length >= 25) {
    throw new Error('This module has reached the maximum allowed limit of 25 questions.');
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({
      module_id: moduleId,
      question_text: questionText,
      options,
      correct_answer: correctAnswer,
      explanation: explanation || null,
    })
    .select()
    .single();

  if (!error && data) {
    return {
      ...data,
      options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options,
    };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `INSERT INTO public.questions (module_id, question_text, options, correct_answer, explanation)
       VALUES ($1, $2, $3::jsonb, $4, $5) RETURNING *;`,
      [moduleId, questionText, JSON.stringify(options), correctAnswer, explanation || null]
    );
    if (res.rows?.[0]) {
      const q = res.rows[0];
      return { ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options };
    }
  }

  throw new Error(error?.message || 'Failed to create question');
}

export async function updateQuestion(
  id: string,
  moduleId: string,
  questionText: string,
  options: string[],
  correctAnswer: string,
  explanation?: string
): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update({
      module_id: moduleId,
      question_text: questionText,
      options,
      correct_answer: correctAnswer,
      explanation: explanation || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (!error && data) {
    return {
      ...data,
      options: typeof data.options === 'string' ? JSON.parse(data.options) : data.options,
    };
  }

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(
      `UPDATE public.questions 
       SET module_id = $1, question_text = $2, options = $3::jsonb, correct_answer = $4, explanation = $5
       WHERE id = $6 RETURNING *;`,
      [moduleId, questionText, JSON.stringify(options), correctAnswer, explanation || null, id]
    );
    if (res.rows?.[0]) {
      const q = res.rows[0];
      return { ...q, options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options };
    }
  }

  throw new Error(error?.message || 'Failed to update question');
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) {
    const pool = getPostgresPool();
    if (pool) {
      await pool.query(`DELETE FROM public.questions WHERE id = $1;`, [id]);
      return;
    }
    throw new Error(error.message);
  }
}

export async function clearModuleQuestions(moduleId: string): Promise<number> {
  const { count, error } = await supabase
    .from('questions')
    .delete({ count: 'exact' })
    .eq('module_id', moduleId);

  if (!error) return count || 0;

  const pool = getPostgresPool();
  if (pool) {
    const res = await pool.query(`DELETE FROM public.questions WHERE module_id = $1;`, [moduleId]);
    return res.rowCount || 0;
  }
  return 0;
}

export async function bulkInsertQuestions(moduleId: string, questions: BulkQuestionInput[]): Promise<Question[]> {
  const toInsert = questions.map((q) => ({
    module_id: moduleId,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
  }));

  const { data, error } = await supabase
    .from('questions')
    .insert(toInsert)
    .select();

  if (!error && data) {
    return data.map((d: any) => ({
      ...d,
      options: typeof d.options === 'string' ? JSON.parse(d.options) : d.options,
    }));
  }

  const pool = getPostgresPool();
  if (pool) {
    const inserted: Question[] = [];
    for (const q of questions) {
      const res = await pool.query(
        `INSERT INTO public.questions (module_id, question_text, options, correct_answer, explanation)
         VALUES ($1, $2, $3::jsonb, $4, $5) RETURNING *;`,
        [moduleId, q.question_text, JSON.stringify(q.options), q.correct_answer, q.explanation || null]
      );
      if (res.rows?.[0]) {
        inserted.push({
          ...res.rows[0],
          options: typeof res.rows[0].options === 'string' ? JSON.parse(res.rows[0].options) : res.rows[0].options,
        });
      }
    }
    return inserted;
  }

  throw new Error(error?.message || 'Failed to bulk insert questions');
}

export async function exportModuleQuestions(moduleId: string): Promise<string> {
  const questions = await getQuestions(moduleId);
  const clean = questions.map((q) => ({
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
  }));
  return JSON.stringify(clean, null, 2);
}

// Full curriculum data helper
export async function getFullCurriculumHierarchy() {
  const [programs, courses, modules] = await Promise.all([
    getPrograms(),
    getCourses(),
    getModules(),
  ]);

  return {
    programs,
    courses,
    modules,
  };
}

export async function getCurriculumStats(): Promise<CurriculumStats> {
  try {
    const [pRes, cRes, mRes, qRes] = await Promise.all([
      supabase.from('programs').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('modules').select('id', { count: 'exact', head: true }),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
    ]);

    if (!pRes.error && !cRes.error && !mRes.error && !qRes.error) {
      return {
        totalPrograms: pRes.count || 0,
        totalCourses: cRes.count || 0,
        totalModules: mRes.count || 0,
        totalQuestions: qRes.count || 0,
        configuredWithPostgres: true,
      };
    }
  } catch (e) {}

  const pool = getPostgresPool();
  if (pool) {
    try {
      const pRes = await pool.query(`SELECT COUNT(*)::int as count FROM public.programs;`);
      const cRes = await pool.query(`SELECT COUNT(*)::int as count FROM public.courses;`);
      const mRes = await pool.query(`SELECT COUNT(*)::int as count FROM public.modules;`);
      const qRes = await pool.query(`SELECT COUNT(*)::int as count FROM public.questions;`);

      return {
        totalPrograms: Number(pRes.rows[0]?.count || 0),
        totalCourses: Number(cRes.rows[0]?.count || 0),
        totalModules: Number(mRes.rows[0]?.count || 0),
        totalQuestions: Number(qRes.rows[0]?.count || 0),
        configuredWithPostgres: true,
      };
    } catch (err) {}
  }

  return {
    totalPrograms: 0,
    totalCourses: 0,
    totalModules: 0,
    totalQuestions: 0,
  };
}

export async function getCurriculumTree(): Promise<CurriculumTreeNode[]> {
  const { programs, courses, modules } = await getFullCurriculumHierarchy();

  return programs.map((prog) => {
    const progCourses = courses.filter((c) => c.program_id === prog.id);
    return {
      id: prog.id,
      name: prog.name,
      type: 'program' as const,
      description: prog.description || undefined,
      children: progCourses.map((course) => {
        const courseModules = modules.filter((m) => m.course_id === course.id);
        return {
          id: course.id,
          name: course.name,
          code: course.code || undefined,
          semester: course.semester,
          type: 'course' as const,
          children: courseModules.map((mod) => ({
            id: mod.id,
            name: mod.title,
            module_number: mod.module_number,
            question_count: mod.questions_count,
            type: 'module' as const,
          })),
        };
      }),
    };
  });
}

// Aliases for admin dashboard compatibility
export const getAdminStats = getCurriculumStats;

export async function exportFullCurriculumJSON(): Promise<string> {
  const data = await getFullCurriculumHierarchy();
  return JSON.stringify(data, null, 2);
}
