import os
import sys
import re
import json
import docx

sys.stdout.reconfigure(encoding='utf-8')

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def parse_docx(file_path):
    doc = docx.Document(file_path)
    questions = []
    current_q = None
    
    for p_idx, p in enumerate(doc.paragraphs):
        full_text = p.text.strip()
        if not full_text:
            continue
            
        # Pattern A: Paragraph with "✅ Correct answer:" or "Correct answer:"
        if 'correct answer:' in full_text.lower():
            lines = [l.strip() for l in full_text.split('\n') if l.strip()]
            q_lines = []
            opts = []
            ans = ''
            for l in lines:
                if re.match(r'^(?:✅|✔)?\s*(?:Correct\s*answer|Answer)\s*:\s*', l, re.I):
                    ans = re.sub(r'^(?:✅|✔)?\s*(?:Correct\s*answer|Answer)\s*:\s*', '', l, flags=re.I).strip()
                elif re.match(r'^[a-dA-D][\)\.]\s*', l):
                    opts.append(clean_text(l))
                elif not opts:
                    q_lines.append(l)
            
            q_stem = ' '.join(q_lines).strip()
            if not q_stem:
                # Look backwards for the question stem paragraph
                for back_i in range(p_idx - 1, max(-1, p_idx - 6), -1):
                    cand = doc.paragraphs[back_i].text.strip()
                    if cand and not re.match(r'^[a-dA-D][\)\.]', cand) and 'correct answer:' not in cand.lower():
                        q_stem = cand
                        break
            
            if opts:
                q_stem = re.sub(r'^\d+[\.\)]\s*', '', q_stem)
                matched_ans = ans
                letter_match = re.match(r'^([a-dA-D])[\)\.]?\s*(.*)', ans)
                if letter_match:
                    letter = letter_match.group(1).upper()
                    rest = letter_match.group(2).strip()
                    for opt in opts:
                        opt_letter = opt[0].upper()
                        if opt_letter == letter:
                            matched_ans = re.sub(r'^[a-dA-D][\)\.]\s*', '', opt).strip()
                            break
                    if not matched_ans and rest:
                        matched_ans = rest
                else:
                    matched_ans = ans
                
                cleaned_opts = [re.sub(r'^[a-dA-D][\)\.]\s*', '', o).strip() for o in opts]
                if not matched_ans and len(cleaned_opts) > 0:
                    matched_ans = cleaned_opts[0]
                    
                questions.append({
                    'question_text': clean_text(q_stem),
                    'options': cleaned_opts,
                    'correct_answer': matched_ans,
                    'explanation': f"The verified correct answer is: {matched_ans}"
                })
                current_q = None
                continue

        # Pattern B: Question with options in a single paragraph where correct answer is bold
        bold_runs = [r.text.strip() for r in p.runs if r.bold and r.text.strip()]
        lines = [l.strip() for l in full_text.split('\n') if l.strip()]
        if len(lines) >= 4 and any(re.match(r'^[a-dA-D][\)\.]', l) for l in lines[1:]):
            q_text = lines[0]
            q_text = re.sub(r'^\d+[\.\)]\s*', '', q_text)
            opts = []
            ans = ''
            for l in lines[1:]:
                if re.match(r'^[a-dA-D][\)\.]', l):
                    clean_opt = re.sub(r'^[a-dA-D][\)\.]\s*', '', l).strip()
                    opts.append(clean_opt)
                    for b in bold_runs:
                        if b in l and len(b) > 2 and not re.match(r'^\d+[\.\)]', b):
                            ans = clean_opt
            if opts:
                if not ans:
                    ans = opts[0]
                questions.append({
                    'question_text': clean_text(q_text),
                    'options': opts,
                    'correct_answer': ans,
                    'explanation': f"The verified correct option is: {ans}"
                })
                continue

        # Pattern C: Multi-paragraph format (Abdullah Siddiqui style)
        opt_match = re.match(r'^(?:[★◆\s]*)?([A-D])[\)\.]\s*(.*)', full_text)
        if opt_match and current_q is not None:
            raw_text = opt_match.group(2).strip()
            is_correct = False
            if '✓' in full_text or '✔' in full_text or '==' in full_text:
                is_correct = True
            for r in p.runs:
                if r.bold and len(r.text.strip()) > 3:
                    is_correct = True
            
            clean_opt = raw_text.replace('✓', '').replace('✔', '').replace('==', '').strip()
            clean_opt = re.sub(r'^[A-D][\)\.]\s*', '', clean_opt).strip()
            current_q['options'].append(clean_opt)
            if is_correct:
                current_q['correct_answer'] = clean_opt
                
            if len(current_q['options']) == 4 or opt_match.group(1).upper() == 'D':
                if not current_q['correct_answer'] and len(current_q['options']) > 0:
                    current_q['correct_answer'] = current_q['options'][0]
                current_q['explanation'] = f"The verified correct answer is: {current_q['correct_answer']}"
                questions.append(current_q)
                current_q = None
            continue

        # Check question stem
        is_q_stem = False
        if re.match(r'^(?:Q\s*\d+[\.:\)]|\d+[\.:\)])\s+', full_text):
            is_q_stem = True
        elif (full_text.endswith('?') or 'Which' in full_text or 'What' in full_text or 'How' in full_text or 'Why' in full_text) and len(full_text) > 15:
            if not re.match(r'^[A-D][\)\.]', full_text):
                is_q_stem = True
                
        if is_q_stem:
            if current_q and len(current_q['options']) >= 2:
                if not current_q['correct_answer']:
                    current_q['correct_answer'] = current_q['options'][0]
                current_q['explanation'] = f"The verified correct answer is: {current_q['correct_answer']}"
                questions.append(current_q)
                
            q_text = re.sub(r'^(?:Q\s*\d+[\.:\)]|\d+[\.:\)])\s*', '', full_text)
            current_q = {
                'question_text': clean_text(q_text),
                'options': [],
                'correct_answer': '',
                'explanation': ''
            }

    if current_q and len(current_q['options']) >= 2:
        if not current_q['correct_answer']:
            current_q['correct_answer'] = current_q['options'][0]
        current_q['explanation'] = f"The verified correct answer is: {current_q['correct_answer']}"
        questions.append(current_q)

    return questions

# Curriculum mapping structure
CURRICULUM_DEFINITION = [
    # SEMESTER 1
    {
        "semester": 1,
        "course_name": "Responsive Web Design & Standards (HTML5 & CSS3)",
        "course_code": "ACCP-101",
        "modules": [
            {
                "module_number": 1,
                "title": "HTML5 Core Semantic Elements & Forms",
                "file": "Questions/Semester_1/Miss Kainat/🌐 HTML Multiple Choice Questions.docx"
            },
            {
                "module_number": 2,
                "title": "Modern CSS3 Styling & Box Model",
                "file": "Questions/Semester_1/Miss Kainat/🎨 CSS Multiple Choice Questions.docx"
            },
            {
                "module_number": 3,
                "title": "Responsive Layouts & Flexbox Techniques",
                "file": "Questions/Semester_1/Abdullah Siddiqui/Term1_PWD.docx"
            }
        ]
    },
    {
        "semester": 1,
        "course_name": "UI Frameworks & Dynamic Scripting (Bootstrap & jQuery)",
        "course_code": "ACCP-102",
        "modules": [
            {
                "module_number": 1,
                "title": "Bootstrap Framework & Responsive Grid",
                "file": "Questions/Semester_1/Miss Kainat/Bootstrap Framework MCQ Bank.docx"
            },
            {
                "module_number": 2,
                "title": "jQuery Library & DOM Manipulation",
                "file": "Questions/Semester_1/Miss Kainat/Jquery Multiple Choice Questions.docx"
            },
            {
                "module_number": 3,
                "title": "Bootstrap & jQuery Integrated Question Bank",
                "file": "Questions/Semester_1/Abdullah Siddiqui/Bootstrap & Jquery.docx"
            }
        ]
    },
    {
        "semester": 1,
        "course_name": "Distributed Version Control (Git & GitHub)",
        "course_code": "ACCP-103",
        "modules": [
            {
                "module_number": 1,
                "title": "Git Essentials, Branching & Commits",
                "file": "Questions/Semester_1/Abdullah Siddiqui/Term1_GITHUB.docx"
            },
            {
                "module_number": 2,
                "title": "Distributed Version Control Systems (DVCS)",
                "file": "Questions/Semester_1/Miss Kainat/Distributed Version Control MCQS.docx"
            }
        ]
    },
    {
        "semester": 1,
        "course_name": "Search Engine Optimization & Web Analytics (SEO)",
        "course_code": "ACCP-104",
        "modules": [
            {
                "module_number": 1,
                "title": "SEO Strategy, Local Search & Auditing",
                "file": "Questions/Semester_1/Abdullah Siddiqui/Term1_SEO.docx"
            },
            {
                "module_number": 2,
                "title": "On-Page & Off-Page Optimization Standards",
                "file": "Questions/Semester_1/Miss Kainat/Optimize Web for Search Engin SEO Multiple Choice Questions.docx"
            }
        ]
    },
    {
        "semester": 1,
        "course_name": "Office Productivity & Business Applications",
        "course_code": "ACCP-105",
        "modules": [
            {
                "module_number": 1,
                "title": "Microsoft Office Suite (Word, Excel, PPT, Access)",
                "file": "Questions/Semester_1/Abdullah Siddiqui/MS_Office.docx"
            }
        ]
    },
    {
        "semester": 1,
        "course_name": "Semester 1 Term End Comprehensive Assessment",
        "course_code": "ACCP-106",
        "modules": [
            {
                "module_number": 1,
                "title": "Comprehensive Semester 1 Term End Exam Bank",
                "file": "Questions/Semester_1/Abdullah Siddiqui/Term1_TermEND.docx"
            }
        ]
    },

    # SEMESTER 2
    {
        "semester": 2,
        "course_name": "JavaScript: Crafting Modern Interactive Applications",
        "course_code": "ACCP-201",
        "modules": [
            {
                "module_number": 1,
                "title": "Core JavaScript, Logic & Functions",
                "file": "Questions/Semester_1/Miss Kainat/🟢 JavaScript Multiple Choice Questions.docx"
            },
            {
                "module_number": 2,
                "title": "Advanced JavaScript, RegEx & Event Handling",
                "file": "Questions/Semester_2/Abdullah Siddiqui/JavaScript_Questions_Merged.docx"
            }
        ]
    },
    {
        "semester": 2,
        "course_name": "Web Development with PHP",
        "course_code": "ACCP-202",
        "modules": [
            {
                "module_number": 1,
                "title": "PHP Syntax, Server-Side Logic & Form Processing",
                "file": "Questions/Semester_2/Miss Kainat/Web Development with PHP.docx"
            },
            {
                "module_number": 2,
                "title": "Architecting Web Applications with PHP 8",
                "file": "Questions/Semester_2/Abdullah Siddiqui/PHP_Questions_Merged.docx"
            }
        ]
    },
    {
        "semester": 2,
        "course_name": "Laravel Framework for Web Applications",
        "course_code": "ACCP-203",
        "modules": [
            {
                "module_number": 1,
                "title": "Laravel Routing, Controllers & Blade Views",
                "file": "Questions/Semester_2/Miss Kainat/Laravel Framework For WD.docx"
            },
            {
                "module_number": 2,
                "title": "Eloquent ORM, Migrations & Query Scopes",
                "file": "Questions/Semester_2/Abdullah Siddiqui/Laravel_Questions_Merged.docx"
            }
        ]
    },
    {
        "semester": 2,
        "course_name": "Relational Database Management with MySQL",
        "course_code": "ACCP-204",
        "modules": [
            {
                "module_number": 1,
                "title": "MySQL Schema Design & SQL Queries",
                "file": "Questions/Semester_2/Miss Kainat/Working with MYSQL MCQS.docx"
            },
            {
                "module_number": 2,
                "title": "Advanced MySQL Indexing & Transactions",
                "file": "Questions/Semester_2/Abdullah Siddiqui/MySQL.docx"
            }
        ]
    },
    {
        "semester": 2,
        "course_name": "Content Management Systems (WordPress & Drupal)",
        "course_code": "ACCP-205",
        "modules": [
            {
                "module_number": 1,
                "title": "CMS Fundamentals & Content Publishing",
                "file": "Questions/Semester_2/Miss Kainat/Build and Manage Websites using CMS.docx"
            },
            {
                "module_number": 2,
                "title": "Theme Customization, Security & Administration",
                "file": "Questions/Semester_2/Abdullah Siddiqui/CMS_Questions_Merged.docx"
            }
        ]
    },
    {
        "semester": 2,
        "course_name": "Data Processing with XML & JSON",
        "course_code": "ACCP-206",
        "modules": [
            {
                "module_number": 1,
                "title": "XML Schemas, Parsing & Data Interchange",
                "file": "Questions/Semester_2/Miss Kainat/Data Processing using XML and JSON MCQS.docx"
            },
            {
                "module_number": 2,
                "title": "JSON Serialization & API Payload Architecture",
                "file": "Questions/Semester_2/Abdullah Siddiqui/XML_JSON_100_MCQs.docx"
            }
        ]
    },
    {
        "semester": 2,
        "course_name": "Semester 2 Term End Comprehensive Assessment",
        "course_code": "ACCP-207",
        "modules": [
            {
                "module_number": 1,
                "title": "Comprehensive Semester 2 Term End Examination",
                "file": "Questions/Semester_2/Abdullah Siddiqui/TermEnd_Questions_Merged.docx"
            }
        ]
    },

    # SEMESTER 3
    {
        "semester": 3,
        "course_name": "Enterprise Web Applications with ASP.NET Core MVC",
        "course_code": "ACCP-301",
        "modules": [
            {
                "module_number": 1,
                "title": "ASP.NET Core MVC Architecture & Razor Pages",
                "file": "Questions/Semester_3/Application with .NET CORE MVC.docx"
            }
        ]
    },
    {
        "semester": 3,
        "course_name": "Proficient Programming with C#",
        "course_code": "ACCP-302",
        "modules": [
            {
                "module_number": 1,
                "title": "C# Language Fundamentals & Object-Oriented Design",
                "file": "Questions/Semester_3/Proficient Programming with C#.docx"
            }
        ]
    },
    {
        "semester": 3,
        "course_name": "Efficient Data Solutions for Microsoft SQL Server",
        "course_code": "ACCP-303",
        "modules": [
            {
                "module_number": 1,
                "title": "T-SQL Queries, Stored Procedures & Indexing",
                "file": "Questions/Semester_3/Efficent Data Sol for SQL Server.docx"
            }
        ]
    },
    {
        "semester": 3,
        "course_name": "Modern Front-End UI with TypeScript & Angular",
        "course_code": "ACCP-304",
        "modules": [
            {
                "module_number": 1,
                "title": "Angular Components, Services & TypeScript Typing",
                "file": "Questions/Semester_3/Building Ul with Typecript and Material UI.docx"
            }
        ]
    },

    # SEMESTER 4
    {
        "semester": 4,
        "course_name": "Cross-Platform Mobile Apps with Flutter & Dart",
        "course_code": "ACCP-401",
        "modules": [
            {
                "module_number": 1,
                "title": "Flutter Widget Tree & State Management",
                "file": "Questions/Semester_4/App Development using flutter and dart.docx"
            }
        ]
    },
    {
        "semester": 4,
        "course_name": "Object-Oriented Dart Programming",
        "course_code": "ACCP-402",
        "modules": [
            {
                "module_number": 1,
                "title": "Dart Syntax, Asynchronous Streams & Collections",
                "file": "Questions/Semester_4/Dart programming .docx"
            }
        ]
    },
    {
        "semester": 4,
        "course_name": "Cloud Solutions with Microsoft Azure",
        "course_code": "ACCP-403",
        "modules": [
            {
                "module_number": 1,
                "title": "Azure Cloud Architecture, Compute & Security",
                "file": "Questions/Semester_4/Developing Microsoft Azure.docx"
            }
        ]
    },
    {
        "semester": 4,
        "course_name": "Agile & DevOps Principles for Software Projects",
        "course_code": "ACCP-404",
        "modules": [
            {
                "module_number": 1,
                "title": "Scrum, CI/CD Pipelines & Continuous Delivery",
                "file": "Questions/Semester_4/Agile & Devops.docx"
            }
        ]
    }
]

out_data = []
total_q = 0

for course in CURRICULUM_DEFINITION:
    c_data = {
        "semester": course["semester"],
        "course_name": course["course_name"],
        "course_code": course["course_code"],
        "modules": []
    }
    for m in course["modules"]:
        f_path = m["file"]
        if os.path.exists(f_path):
            qs = parse_docx(f_path)
            c_data["modules"].append({
                "module_number": m["module_number"],
                "title": m["title"],
                "file": f_path,
                "question_count": len(qs),
                "questions": qs
            })
            total_q += len(qs)
            print(f"[{course['course_code']}] {m['title']} -> {len(qs)} MCQs")
        else:
            print(f"ERROR: File not found {f_path}")
            
    out_data.append(c_data)

out_file = "scripts/parsed_curriculum_questions.json"
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print("==================================================")
print(f"Saved {total_q} questions to {out_file}")
print("==================================================")
