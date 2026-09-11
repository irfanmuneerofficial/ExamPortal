import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/parsed_curriculum_questions.json', 'r', encoding='utf-8') as f:
    curriculum = json.load(f)

# Build sample data code
prog_id = '19843784-d0b0-466c-8168-b1fe6adbdd46' # ACCP AI
pro_id = '95d4a391-7752-4e85-83e1-ac4e1908aaa5' # ACCP PRO

code = []
code.append("import { Program, Course, Module, Question } from './types';\n")

code.append("export const SAMPLE_PROGRAMS: Program[] = [")
code.append("  {")
code.append(f"    id: '{prog_id}',")
code.append("    name: 'ACCP AI',")
code.append("    description: 'Aptech Certified Computer Professional - Artificial Intelligence & Data Science track spanning Semesters 1 to 6.',")
code.append("    created_at: new Date().toISOString(),")
code.append(f"    courses_count: {len(curriculum)},")
code.append("  },")
code.append("  {")
code.append(f"    id: '{pro_id}',")
code.append("    name: 'ACCP PRO',")
code.append("    description: 'Aptech Certified Computer Professional - Professional Software Engineering track spanning Semesters 1 to 6.',")
code.append("    created_at: new Date().toISOString(),")
code.append(f"    courses_count: {len(curriculum)},")
code.append("  },")
code.append("];\n")

# Courses
code.append("export const SAMPLE_COURSES: Course[] = [")
courses_list = []
modules_list = []
questions_sample = []

for c_idx, c in enumerate(curriculum):
    c_id = f"course-accp-{c['course_code'].lower()}"
    courses_list.append(c_id)
    code.append("  {")
    code.append(f"    id: '{c_id}',")
    code.append(f"    program_id: '{prog_id}',")
    code.append(f"    name: {json.dumps(c['course_name'])},")
    code.append(f"    code: '{c['course_code']}',")
    code.append(f"    semester: {c['semester']},")
    code.append("    created_at: new Date().toISOString(),")
    code.append(f"    modules_count: {len(c['modules'])},")
    code.append("  },")

code.append("];\n")

# Modules
code.append("export const SAMPLE_MODULES: Module[] = [")
for c in curriculum:
    c_id = f"course-accp-{c['course_code'].lower()}"
    for m in c['modules']:
        m_id = f"mod-{c['course_code'].lower()}-{m['module_number']}"
        modules_list.append(m_id)
        code.append("  {")
        code.append(f"    id: '{m_id}',")
        code.append(f"    course_id: '{c_id}',")
        code.append(f"    title: {json.dumps(m['title'])},")
        code.append(f"    module_number: {m['module_number']},")
        code.append("    created_at: new Date().toISOString(),")
        code.append(f"    questions_count: {len(m['questions'])},")
        code.append("  },")

code.append("];\n")

# Questions sample (take first 5 from each module to keep fallback responsive & light ~ 150 Qs)
code.append("export const SAMPLE_QUESTIONS_25: Question[] = [")
q_count = 0
for c in curriculum:
    for m in c['modules']:
        m_id = f"mod-{c['course_code'].lower()}-{m['module_number']}"
        for q in m['questions'][:5]:
            q_count += 1
            code.append("  {")
            code.append(f"    id: 'q-sample-{q_count}',")
            code.append(f"    module_id: '{m_id}',")
            code.append(f"    question_text: {json.dumps(q['question_text'])},")
            code.append(f"    options: {json.dumps(q['options'])},")
            code.append(f"    correct_answer: {json.dumps(q['correct_answer'])},")
            code.append(f"    explanation: {json.dumps(q.get('explanation') or 'The verified correct answer.')},")
            code.append("    created_at: new Date().toISOString(),")
            code.append("  },")

code.append("];\n")

out_file = 'lib/sample-data.ts'
with open(out_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(code))

print(f"Updated {out_file} with {len(curriculum)} courses, {len(modules_list)} modules, and {q_count} sample questions.")
