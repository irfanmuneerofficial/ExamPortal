import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { StudentNavbar } from '@/components/student/StudentNavbar';
import { getPrograms, getCourses } from '@/lib/db';

export const revalidate = 0;

interface ProgramPageProps {
  params: Promise<{
    programId: string;
  }>;
}

export default async function ProgramCoursesPage({ params }: ProgramPageProps) {
  const { programId } = await params;

  const [programs, courses] = await Promise.all([
    getPrograms(),
    getCourses(programId),
  ]);

  const currentProgram = programs.find((p) => p.id === programId);

  if (!currentProgram) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Navbar with Breadcrumb */}
      <StudentNavbar
        breadcrumb={[
          { label: currentProgram.name },
        ]}
      />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Programs</span>
        </Link>

        {/* Program Header Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <GraduationCap className="w-4 h-4 text-foreground" />
            <span>Academic Program Track</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            {currentProgram.name}
          </h1>
          {currentProgram.description && (
            <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
              {currentProgram.description}
            </p>
          )}
        </div>

        {/* Modules Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Available Modules</h2>
            <span className="font-mono text-xs text-muted-foreground font-medium">
              {courses.length} modules in this track
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-3xl border border-dashed border-border space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No Modules Available</h3>
              <p className="text-xs text-muted-foreground">
                Modules for this track will be configured soon in the admin panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/${programId}/${course.id}`}
                  className="group p-6 rounded-3xl bg-card border border-border hover:border-foreground/40 transition-all duration-200 hover:-translate-y-1 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      {course.code && (
                        <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-muted text-foreground border border-border font-bold">
                          {course.code}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:underline transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        4 Comprehensive Module Parts (Parts 1 to 4 with 25 MCQs each)
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border flex items-center justify-between font-mono text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>View Module Parts</span>
                    </div>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
