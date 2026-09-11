import os
import sys
import re
import docx

sys.stdout.reconfigure(encoding='utf-8')

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def parse_docx(file_path):
    doc = docx.Document(file_path)
    questions = []
    
    # Check if doc has single paragraph questions or multi-paragraph questions
    # Pattern 1: Inline questions with "✅ Correct answer:" or "Correct answer:"
    # Pattern 2: Paragraph for Q, Paragraphs for A) B) C) D) with checkmarks or bold
    
    current_q = None
    
    for p_idx, p in enumerate(doc.paragraphs):
        full_text = p.text.strip()
        if not full_text:
            continue
            
        # Check for Pattern A: Paragraph contains question AND options AND answer
        # e.g.:
        # Question text?
        # a) ...
        # b) ...
        # c) ...
        # d) ...
        # ✅ Correct answer: ...
        if 'Correct answer:' in full_text or 'correct answer:' in full_text.lower():
            lines = [l.strip() for l in full_text.split('\n') if l.strip()]
            q_lines = []
            opts = []
            ans = ''
            for l in lines:
                if re.match(r'^(?:✅|✔)?\s*(?:Correct\s*answer|Answer)\s*:\s*', l, re.I):
                    ans = re.sub(r'^(?:✅|✔)?\s*(?:Correct\s*answer|Answer)\s*:\s*', '', l, flags=re.I).strip()
                elif re.match(r'^[a-dA-D][\)\.]\s+', l):
                    opts.append(clean_text(l))
                elif not opts:
                    q_lines.append(l)
            
            if q_lines and opts:
                q_text = clean_text(' '.join(q_lines))
                # Remove leading number like "1. "
                q_text = re.sub(r'^\d+[\.\)]\s*', '', q_text)
                # If ans is just letter e.g. "b) Inserts a line break" or "b"
                matched_ans = ans
                # Resolve letter to full option text if needed
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
                
                # clean options to remove "a) " prefix
                cleaned_opts = [re.sub(r'^[a-dA-D][\)\.]\s*', '', o).strip() for o in opts]
                if not matched_ans and len(cleaned_opts) > 0:
                    matched_ans = cleaned_opts[0]
                    
                questions.append({
                    'question_text': q_text,
                    'options': cleaned_opts,
                    'correct_answer': matched_ans,
                    'file': os.path.basename(file_path)
                })
                continue

        # Pattern B: Question with options in a single paragraph where correct answer is bold
        # (e.g. Bootstrap Framework MCQ Bank.docx)
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
                    # Check if any bold run matches this option
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
                    'file': os.path.basename(file_path)
                })
                continue

        # Pattern C: Multi-paragraph format (Abdullah Siddiqui style)
        # Option line: starts with A) or A. or contains ✓ or ✔
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
                # Finalize question
                if not current_q['correct_answer'] and len(current_q['options']) > 0:
                    current_q['correct_answer'] = current_q['options'][0]
                questions.append(current_q)
                current_q = None
            continue

        # Check if line looks like a question stem:
        # starts with 1. or Q1. or ends with ? or contains question indicators
        is_q_stem = False
        if re.match(r'^(?:Q\s*\d+[\.:\)]|\d+[\.:\)])\s+', full_text):
            is_q_stem = True
        elif (full_text.endswith('?') or 'Which' in full_text or 'What' in full_text or 'How' in full_text or 'Why' in full_text) and len(full_text) > 15:
            # Check not an option
            if not re.match(r'^[A-D][\)\.]', full_text):
                is_q_stem = True
                
        if is_q_stem:
            # If we had a pending question, save it if it had at least 2 options
            if current_q and len(current_q['options']) >= 2:
                if not current_q['correct_answer']:
                    current_q['correct_answer'] = current_q['options'][0]
                questions.append(current_q)
                
            q_text = re.sub(r'^(?:Q\s*\d+[\.:\)]|\d+[\.:\)])\s*', '', full_text)
            current_q = {
                'question_text': clean_text(q_text),
                'options': [],
                'correct_answer': '',
                'file': os.path.basename(file_path)
            }

    # Save last pending question
    if current_q and len(current_q['options']) >= 2:
        if not current_q['correct_answer']:
            current_q['correct_answer'] = current_q['options'][0]
        questions.append(current_q)

    return questions

# Run test on all files
base_dir = 'Questions'
total_all = 0
for root, dirs, files in sorted(os.walk(base_dir)):
    for f in sorted(files):
        if f.endswith('.docx') or f.endswith('.doc'):
            p = os.path.join(root, f)
            try:
                qs = parse_docx(p)
                print(f'{f:50} -> {len(qs):4} MCQs')
                total_all += len(qs)
            except Exception as e:
                print(f'ERR in {f}: {e}')

print('=============================================')
print(f'TOTAL PARSED QUESTIONS: {total_all}')
print('=============================================')
