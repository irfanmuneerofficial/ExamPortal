import React from 'react';
import { notFound } from 'next/navigation';
import { getModules, getQuestions } from '@/lib/db';
import { QuizEngine } from '@/components/student/QuizEngine';
import { StudentNavbar } from '@/components/student/StudentNavbar';
import { StudentFooter } from '@/components/student/StudentFooter';
import { QuizMode } from '@/lib/types';

export const revalidate = 0;

interface QuizPortalPageProps {
  params: Promise<{
    moduleId: string;
  }>;
  searchParams: Promise<{
    mode?: string;
    programId?: string;
    courseId?: string;
  }>;
}

export default async function QuizPortalPage({
  params,
  searchParams,
}: QuizPortalPageProps) {
  const { moduleId } = await params;
  const { mode = 'study', programId, courseId } = await searchParams;

  const validMode: QuizMode = mode === 'exam' ? 'exam' : 'study';

  const [modules, questions] = await Promise.all([
    getModules(),
    getQuestions(moduleId),
  ]);

  const currentModule = modules.find((m) => m.id === moduleId);

  if (!currentModule) {
    notFound();
  }

  return (
    <div className="wireframe-container">
      <StudentNavbar
        breadcrumb={[
          { label: currentModule.title || 'Exam Engine' },
        ]}
      />

      <main className="flex-1 p-4 sm:p-8 lg:p-10 w-full">
        <QuizEngine
          moduleData={currentModule}
          initialQuestions={questions}
          initialMode={validMode}
          programId={programId}
          courseId={courseId}
        />
      </main>
      <StudentFooter />
    </div>
  );
}
