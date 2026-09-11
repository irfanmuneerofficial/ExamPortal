import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Layers,
  BookOpen,
  ArrowLeft,
  Clock,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { StudentNavbar } from '@/components/student/StudentNavbar';
import { getPrograms, getCourses, getModules } from '@/lib/db';

export const revalidate = 0;

interface CourseModulesPageProps {
  params: Promise<{
    programId: string;
    courseId: string;
  }>;
}

export default async function CourseModulesPage({ params }: CourseModulesPageProps) {
  const { programId, courseId } = await params;

  const [programs, courses, modules] = await Promise.all([
    getPrograms(),
    getCourses(programId),
    getModules(courseId),
  ]);

  const currentProgram = programs.find((p) => p.id === programId);
  const currentCourse = courses.find((c) => c.id === courseId);

  if (!currentProgram || !currentCourse) {
    notFound();
  }

  // Ensure modules 1-4 are sorted
  const sortedModules = [...modules].sort((a, b) => a.module_number - b.module_number);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Navbar with Breadcrumb */}
      <StudentNavbar
        breadcrumb={[
          { label: currentProgram.name, href: `/${programId}` },
          { label: currentCourse.name },
        ]}
      />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Back Link */}
        <Link
          href={`/${programId}`}
          className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {currentProgram.name} Modules</span>
        </Link>

        {/* Module Header Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="w-4 h-4 text-foreground" />
            <span>Module Track {currentCourse.code ? `(${currentCourse.code})` : ''}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {currentCourse.name}
          </h1>
          <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
            Choose a module part below to practice in <strong>Study Mode</strong> (with immediate explanations) or take a timed <strong>Exam Mode</strong> (25 minutes, 25 MCQs).
          </p>
        </div>

        {/* Mode comparison banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-muted/60 border border-border text-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-card border border-border text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Study Mode</h4>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Untimed practice with instant feedback on each option and full pedagogical explanations.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/60 border border-border text-xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-card border border-border text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Exam Mode</h4>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                Strict 25-minute countdown, no instant answers, auto-submission, followed by a comprehensive scorecard.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Module Parts Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Module Parts</h2>
            <span className="font-mono text-xs text-muted-foreground font-medium">
              4 Module Parts (Parts 1 to 4)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedModules.map((module) => (
              <div
                key={module.id}
                className="p-6 sm:p-7 rounded-3xl bg-card border border-border hover:border-foreground/40 transition-all shadow-xs flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-muted text-foreground font-mono font-bold border border-border text-xs">
                      Module Part {module.module_number}
                    </span>
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-foreground" />
                      <span>{module.questions_count ?? 25} Questions</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:underline transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      Comprehensive test bank covering key theoretical concepts, implementations, and problem-solving.
                    </p>
                  </div>
                </div>

                {/* Launch Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border font-mono text-xs">
                  <Link
                    href={`/portal/${module.id}?mode=study&programId=${programId}&courseId=${courseId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-muted hover:bg-border text-foreground border border-border font-semibold transition-colors active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span>Study Mode</span>
                  </Link>

                  <Link
                    href={`/portal/${module.id}?mode=exam&programId=${programId}&courseId=${courseId}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity active:scale-95 shadow-xs"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Exam Mode</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
