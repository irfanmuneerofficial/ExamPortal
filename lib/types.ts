// 1. Program (Academic Track / Batch e.g. ACCP PRO, ACCP AI)
export interface Program {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  courses_count?: number;
}

// 2. Module (Subject / Course within a Semester e.g. Responsive Web Design)
export interface Course {
  id: string;
  program_id: string;
  name: string;
  code?: string | null;
  semester?: number; // 1 to 6
  created_at?: string;
  programs?: Program | null;
  modules_count?: number; // Count of parts (1-4)
  questions_count?: number;
}
export type ModuleItem = Course;

// 3. Module Part (Unit / Part 1 to 4 under each Module)
export interface Module {
  id: string;
  course_id: string;
  title: string;
  module_number: number; // 1 to 4 (Part 1 to 4)
  created_at?: string;
  courses?: Course | null;
  questions_count?: number;
}
export type ModulePart = Module;

export interface Question {
  id: string;
  module_id: string;
  question_text: string;
  options: string[]; // 4 options
  correct_answer: string;
  explanation?: string | null;
  created_at?: string;
  modules?: Module | null;
}

export type QuizMode = 'study' | 'exam';

export interface QuizSubmission {
  moduleId: string;
  moduleTitle?: string;
  courseName?: string;
  mode: QuizMode;
  totalQuestions: number;
  score: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  userAnswers: Record<string, string>; // questionId -> selectedOption
  submittedAt?: string;
}

export interface BulkQuestionInput {
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

export interface StudentPracticeHistory {
  id: string;
  moduleId: string;
  moduleTitle: string;
  courseName: string;
  programName?: string;
  mode: QuizMode;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  date: string;
}

export interface CurriculumStats {
  totalPrograms: number;
  totalCourses: number;
  totalModules: number;
  totalQuestions: number;
  configuredWithPostgres?: boolean;
  configuredWithSupabase?: boolean;
}

export interface CurriculumTreeNode {
  id: string;
  name: string;
  type: 'program' | 'semester' | 'course' | 'module';
  count?: number;
  children?: CurriculumTreeNode[];
  data?: any;
}

