import json
import sys
import uuid

sys.stdout.reconfigure(encoding='utf-8')

def sql_escape(s):
    if s is None:
        return 'NULL'
    # Escape single quotes for SQL
    return "'" + str(s).replace("'", "''") + "'"

with open('scripts/parsed_curriculum_questions.json', 'r', encoding='utf-8') as f:
    curriculum = json.load(f)

lines = []
lines.append("-- ==============================================================================")
lines.append("-- EXAMPORTAL NATIVE POSTGRESQL FULL DATABASE SCHEMA & ALL 3,546 MCQS DUMP")
lines.append("-- Run this file on your VPS:")
lines.append("--   psql -U examroot -d examportal -f setup_postgres.sql")
lines.append("-- ==============================================================================\n")

lines.append("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";\n")

lines.append("""-- 1. Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Courses (Modules) Table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    semester INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Modules (Parts) Table
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    module_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_courses_semester ON public.courses(semester);
CREATE INDEX IF NOT EXISTS idx_courses_program_id ON public.courses(program_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_module_id ON public.questions(module_id);
""")

# Insert Programs
lines.append("""INSERT INTO public.programs (id, name, description)
VALUES ('19843784-d0b0-466c-8168-b1fe6adbdd46', 'ACCP AI', 'Aptech Certified Computer Professional - Artificial Intelligence & Data Science track spanning Semesters 1 to 6.'),
       ('95d4a391-7752-4e85-83e1-ac4e1908aaa5', 'ACCP PRO', 'Aptech Certified Computer Professional - Professional Software Engineering track spanning Semesters 1 to 6.')
ON CONFLICT (id) DO NOTHING;
""")

prog_id = '19843784-d0b0-466c-8168-b1fe6adbdd46' # ACCP AI

total_q = 0

for c in curriculum:
    course_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"course_{c['course_code']}"))
    lines.append(f"""INSERT INTO public.courses (id, program_id, name, code, semester)
VALUES ('{course_id}', '{prog_id}', {sql_escape(c['course_name'])}, {sql_escape(c['course_code'])}, {c['semester']})
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, semester = EXCLUDED.semester;
""")

    for m in c['modules']:
        mod_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"mod_{c['course_code']}_{m['module_number']}"))
        lines.append(f"""INSERT INTO public.modules (id, course_id, title, module_number)
VALUES ('{mod_id}', '{course_id}', {sql_escape(m['title'])}, {m['module_number']})
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, module_number = EXCLUDED.module_number;
""")

        lines.append(f"DELETE FROM public.questions WHERE module_id = '{mod_id}';")

        # Questions batch
        for q in m['questions']:
            q_id = str(uuid.uuid4())
            opts_json = json.dumps(q['options'], ensure_ascii=False)
            explanation = q.get('explanation') or f"The verified correct answer is: {q['correct_answer']}"
            lines.append(f"""INSERT INTO public.questions (id, module_id, question_text, options, correct_answer, explanation)
VALUES ('{q_id}', '{mod_id}', {sql_escape(q['question_text'])}, {sql_escape(opts_json)}::jsonb, {sql_escape(q['correct_answer'])}, {sql_escape(explanation)});""")
            total_q += 1

out_file = 'scripts/setup_postgres.sql'
with open(out_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print(f"Generated {out_file} with {total_q} questions!")
