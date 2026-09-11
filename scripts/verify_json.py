import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/parsed_curriculum_questions.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for c in data[:5]:
    print(f"Course: [{c['course_code']}] {c['course_name']} (Sem {c['semester']})")
    for m in c['modules']:
        print(f"  Module {m['module_number']}: {m['title']} ({len(m['questions'])} Qs)")
        q0 = m['questions'][0]
        print(f"    Q1: {q0['question_text'][:80]}")
        print(f"    Opts ({len(q0['options'])}): {q0['options']}")
        print(f"    Ans: {q0['correct_answer']}")
        print()
