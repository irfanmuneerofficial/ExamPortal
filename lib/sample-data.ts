import { Program, Course, Module, Question } from './types';

// Empty fallbacks for strict type compatibility — all data is loaded dynamically from Supabase
export const SAMPLE_PROGRAMS: Program[] = [];
export const SAMPLE_COURSES: Course[] = [];
export const SAMPLE_MODULES: Module[] = [];
export const SAMPLE_QUESTIONS_25: Question[] = [];

// Templates used exclusively by BulkQuestionModal UI
export const SAMPLE_TEXT_QUESTIONS_TEMPLATE = `1. What does HTML stand for?
A) Hyper Text Markup Language
B) High Text Marking Language
C) Hyper Tool Multi Language
D) Hyperlinks Text Management Language
Answer: A
Explanation: HTML stands for Hyper Text Markup Language.

2. Which HTML element is used for the largest heading?
A) <head>
B) <h6>
C) <h1>
D) <heading>
Answer: C
Explanation: The <h1> tag defines the most important heading.

3. What is the correct HTML element for inserting a line break?
A) <break>
B) <lb>
C) <br>
D) <newline>
Answer: C
Explanation: The <br> tag inserts a single line break.`;

export const SAMPLE_JSON_QUESTIONS_TEMPLATE = JSON.stringify([
  {
    "question_text": "What does HTML stand for?",
    "options": [
      "Hyper Text Markup Language",
      "High Text Marking Language",
      "Hyper Tool Multi Language",
      "Hyperlinks Text Management Language"
    ],
    "correct_answer": "Hyper Text Markup Language",
    "explanation": "HTML stands for Hyper Text Markup Language."
  },
  {
    "question_text": "Which HTML element is used for the largest heading?",
    "options": [
      "<head>",
      "<h6>",
      "<h1>",
      "<heading>"
    ],
    "correct_answer": "<h1>",
    "explanation": "The <h1> tag defines the most important heading."
  }
], null, 2);
