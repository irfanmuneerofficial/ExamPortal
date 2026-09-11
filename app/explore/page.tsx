import React from 'react';
import { StudentNavbar } from '@/components/student/StudentNavbar';
import { StudentFooter } from '@/components/student/StudentFooter';
import { CurriculumFilter } from '@/components/student/CurriculumFilter';
import { getFullCurriculumHierarchy } from '@/lib/db';
import { Compass } from 'lucide-react';

export const revalidate = 0;

export const metadata = {
  title: 'Curriculum & Exam Explorer | Exam Practice Portal',
  description: 'Filter exams by batch (ACCP PRO, ACCP AI), semester (1-4), subject, and module part.',
};

export default async function ExplorePage() {
  const { programs, courses, modules } = await getFullCurriculumHierarchy();

  return (
    <div className="wireframe-container">
      {/* Navbar with breadcrumb */}
      <StudentNavbar
        breadcrumb={[
          { label: 'Curriculum & Exam Explorer' },
        ]}
      />

      <main className="flex-1 p-6 sm:p-10 lg:p-14 space-y-10">
        {/* Page Banner */}
        <section className="relative rounded-3xl border border-violet-500/30 bg-card/95 backdrop-blur-md p-6 sm:p-10 lg:p-12 space-y-4 shadow-xl shadow-violet-950/20 overflow-hidden">
          {/* Funky candy top bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-pink-500 via-amber-400 to-cyan-400" />
          
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-violet-400">
              ⚡ Curriculum & Exam Explorer
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            Find Your Exact{' '}
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              Exam & Study Track
            </span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
            Filter seamlessly by your <strong>Academic Track</strong> (ACCP AI, ACCP PRO), <strong>Semester</strong> (1–6), <strong>Subject / Module</strong> (HTML & CSS, Java, Python, SQL), and <strong>Module Part</strong> (1–4). Practice in instant feedback Study Mode or test yourself in 25-minute Timed Exam Mode!
          </p>
        </section>

        {/* Interactive Multi-Level Filter */}
        <CurriculumFilter
          programs={programs}
          courses={courses}
          modules={modules}
        />
      </main>

      {/* Student Footer */}
      <StudentFooter />
    </div>
  );
}
