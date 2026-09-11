import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Globe,
  CircleDot,
  Layers,
  Circle,
  Folder,
  HelpCircle,
} from 'lucide-react';
import { StudentNavbar } from '@/components/student/StudentNavbar';
import { StudentFooter } from '@/components/student/StudentFooter';
import { CurriculumFilter } from '@/components/student/CurriculumFilter';
import { StudentPracticeHistoryWidget } from '@/components/student/StudentPracticeHistoryWidget';
import { getFullCurriculumHierarchy } from '@/lib/db';

export const revalidate = 0; // Fresh public catalog

export default async function HomePage() {
  const { programs, courses, modules } = await getFullCurriculumHierarchy();

  // Dynamic calculations for each semester directly from database
  const getSemStats = (sem: number) => {
    const semCourses = courses.filter((c) => c.semester === sem);
    const semMods = modules.filter((m) => semCourses.some((c) => c.id === m.course_id));
    const totalQ = semMods.reduce((acc, m) => acc + (m.questions_count || 0), 0);
    return {
      coursesCount: semCourses.length,
      modulesCount: semMods.length,
      questionsCount: totalQ,
    };
  };

  const sem1Stats = getSemStats(1);
  const sem2Stats = getSemStats(2);
  const sem3Stats = getSemStats(3);
  const sem4Stats = getSemStats(4);
  const totalAllQuestions = modules.reduce((acc, m) => acc + (m.questions_count || 0), 0);

  // Pick real courses from database for featured cards
  const featuredCoursesList = courses.slice(0, 6);
  const featuredCourseCards = featuredCoursesList.map((c) => {
    const courseModules = modules.filter((m) => m.course_id === c.id);
    const firstModule = courseModules[0];
    const totalQuestions = courseModules.reduce((acc, m) => acc + (m.questions_count || 0), 0);
    
    return {
      title: c.name,
      code: c.code || 'ACCP',
      semester: c.semester || 1,
      tag: `Sem ${c.semester || 1}`,
      moduleId: firstModule ? firstModule.id : '',
      description: `${courseModules.length} module part${courseModules.length !== 1 ? 's' : ''} with ${totalQuestions} authentic exam questions.`,
    };
  });

  return (
    <div className="max-w-[1440px] mx-auto min-h-screen border-x border-border flex flex-col bg-background transition-colors">
      {/* Top Navbar */}
      <StudentNavbar />

      {/* Top Hatched Stripe Border Bar */}
      <div className="hatched-stripe-bar" />

      <main id="main-content" className="flex-1">
        {/* ==================================================================== */}
        {/* HERO SECTION: Dynamic Live Data - Exam Practice Portal              */}
        {/* ==================================================================== */}
        <section className="relative px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24 bg-blueprint-grid">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-pink-500/10 to-amber-500/10 text-xs font-mono font-bold text-violet-700 dark:text-violet-300 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>⚡ 25 High-Yield Questions Per Module • Semesters 1 to 4 Ready!</span>
            </div>

            {/* Main Dual-Line Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-black tracking-tight text-foreground leading-[1.08]">
              Crush Every Tech Exam<br />
              <span className="bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                On Your Very First Try! 🚀
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Precision student practice engine with authentic question papers for <strong>ACCP AI</strong> across <strong>Semesters 1 to 4</strong>. Instant pedagogical explanations in Study Mode and realistic 25-minute exam simulations.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
              <a
                href="#exam-finder"
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white text-xs font-mono font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-md"
              >
                ⚡ Start 25m Exam Now
              </a>
              <a
                href="#exam-finder"
                className="px-7 py-3 rounded-xl border-2 border-border bg-card/90 backdrop-blur-xs text-xs font-mono font-bold text-foreground hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 transition-all cursor-pointer shadow-xs"
              >
                🎯 Browse {totalAllQuestions.toLocaleString()}+ Real MCQs
              </a>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* Dynamic Semester-Wise Question Banks & Quick Access Grid             */}
          {/* ==================================================================== */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {/* Semester 1 Card - Emerald / Mint */}
              <div className="group rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-card p-5 shadow-xs hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500 text-white shadow-xs shadow-emerald-500/30">
                      Semester 01
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{sem1Stats.coursesCount} Courses</span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight mb-1">
                    Web & Front-End
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    HTML5, CSS3, Bootstrap, jQuery, Git/GitHub, SEO & MS Office.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">HTML5/CSS3</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">Bootstrap</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">Git</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">SEO</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                  <a
                    href="#exam-finder"
                    className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    View Modules <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{sem1Stats.questionsCount} MCQs</span>
                </div>
              </div>

              {/* Semester 2 Card - Violet / Purple */}
              <div className="group rounded-2xl border-2 border-violet-500/30 bg-gradient-to-b from-violet-500/5 to-card p-5 shadow-xs hover:border-violet-500 hover:shadow-xl hover:shadow-violet-500/15 hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-violet-600 text-white shadow-xs shadow-violet-500/30">
                      Semester 02
                    </span>
                    <span className="font-mono text-[11px] font-bold text-violet-600 dark:text-violet-400">{sem2Stats.coursesCount} Courses</span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight mb-1">
                    Dynamic Web & DB
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    JavaScript, PHP, Laravel, MySQL, WordPress CMS, XML & JSON.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">JavaScript</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">PHP</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">Laravel</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">MySQL</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-violet-500/20 flex items-center justify-between">
                  <a
                    href="#exam-finder"
                    className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
                  >
                    View Modules <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <span className="text-[11px] font-mono font-black text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{sem2Stats.questionsCount} MCQs</span>
                </div>
              </div>

              {/* Semester 3 Card - Punchy Pink / Rose */}
              <div className="group rounded-2xl border-2 border-pink-500/30 bg-gradient-to-b from-pink-500/5 to-card p-5 shadow-xs hover:border-pink-500 hover:shadow-xl hover:shadow-pink-500/15 hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs shadow-pink-500/30">
                      Semester 03
                    </span>
                    <span className="font-mono text-[11px] font-bold text-pink-600 dark:text-pink-400">{sem3Stats.coursesCount} Courses</span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight mb-1">
                    Enterprise & .NET
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    ASP.NET Core MVC, C#, SQL Server, TypeScript & Angular.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">ASP.NET</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">C#</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">SQL Server</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">Angular</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-pink-500/20 flex items-center justify-between">
                  <a
                    href="#exam-finder"
                    className="text-xs font-mono font-bold text-pink-600 dark:text-pink-400 hover:underline inline-flex items-center gap-1"
                  >
                    View Modules <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <span className="text-[11px] font-mono font-black text-pink-600 dark:text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full">{sem3Stats.questionsCount} MCQs</span>
                </div>
              </div>

              {/* Semester 4 Card - Cyber Amber / Orange */}
              <div className="group rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-card p-5 shadow-xs hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs shadow-amber-500/30">
                      Semester 04
                    </span>
                    <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">{sem4Stats.coursesCount} Courses</span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground tracking-tight mb-1">
                    Mobile & Cloud
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Flutter & Dart Mobile, Microsoft Azure, Agile & DevOps.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">Flutter</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">Dart</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">Azure</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">DevOps</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-amber-500/20 flex items-center justify-between">
                  <a
                    href="#exam-finder"
                    className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    View Modules <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <span className="text-[11px] font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{sem4Stats.questionsCount} MCQs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hatched Stripe Border Bar */}
        <div className="hatched-stripe-bar" />

        {/* ==================================================================== */}
        {/* 4-COLUMN REAL CURRICULUM BAR (Matches bottom bar layout)             */}
        {/* ==================================================================== */}
        <section className="bg-background">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Column 1: ACCP PRO */}
            <a href="#exam-finder" className="flex items-center justify-center gap-3.5 py-6 px-4 hover:bg-blue-500/5 transition-all group">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground block group-hover:text-blue-600 transition-colors">ACCP PRO Track</span>
                <span className="text-[10px] font-mono text-muted-foreground">Semesters 1 to 6</span>
              </div>
            </a>

            {/* Column 2: ACCP AI */}
            <a href="#exam-finder" className="flex items-center justify-center gap-3.5 py-6 px-4 hover:bg-violet-500/5 transition-all group">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground block group-hover:text-violet-600 transition-colors">ACCP AI Track</span>
                <span className="text-[10px] font-mono text-muted-foreground font-semibold text-violet-600 dark:text-violet-400">All 21 Courses Active</span>
              </div>
            </a>

            {/* Column 3: 25-Minute Exam */}
            <a href="/portal/62a5115f-218e-5eef-9eb2-0606b8fcbafd?mode=exam" className="flex items-center justify-center gap-3.5 py-6 px-4 hover:bg-pink-500/5 transition-all group">
              <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground block group-hover:text-pink-600 transition-colors">25m Timed Exam</span>
                <span className="text-[10px] font-mono text-muted-foreground">Scorecard & Confetti 🎉</span>
              </div>
            </a>

            {/* Column 4: 25 MCQs / Module */}
            <a href="#featured-subjects" className="flex items-center justify-center gap-3.5 py-6 px-4 hover:bg-emerald-500/5 transition-all group">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground block group-hover:text-emerald-600 transition-colors">825 Curated MCQs</span>
                <span className="text-[10px] font-mono text-muted-foreground">25 Questions / Module</span>
              </div>
            </a>
          </div>
        </section>

        {/* Hatched Stripe Border Bar */}
        <div className="hatched-stripe-bar" />

        {/* ==================================================================== */}
        {/* SECTION 1: Practice History Widget (Real student storage)            */}
        {/* ==================================================================== */}
        <section id="practice-history" className="p-6 sm:p-10 lg:p-12 border-b border-border bg-background">
          <StudentPracticeHistoryWidget />
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: 4-Step Interactive Curriculum Finder                      */}
        {/* ==================================================================== */}
        <section id="exam-finder" className="p-6 sm:p-10 lg:p-14 border-b border-border bg-background">
          <div className="space-y-3 mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-mono font-bold text-violet-700 dark:text-violet-300">
              <span className="h-2 w-2 rounded-full bg-violet-600 animate-pulse" />
              <span>Interactive Step-by-Step Filter</span>
            </div>
            <h2 className="text-2xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-3xl lg:text-[2.5rem]">
              Find Your Module & Launch Practice
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Select your academic track, semester, module, and part to immediately launch <strong>Study Mode</strong> or the <strong>25m Timed Exam</strong>.
            </p>
          </div>

          <CurriculumFilter
            programs={programs}
            courses={courses}
            modules={modules}
          />
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: Popular Subjects Hub                                      */}
        {/* ==================================================================== */}
        <section id="featured-subjects" className="p-6 sm:p-10 lg:p-14 border-b border-border bg-background">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/30 bg-pink-500/10 text-xs font-mono font-bold text-pink-700 dark:text-pink-300">
                <span className="h-2 w-2 rounded-full bg-pink-600" />
                <span>Fast-Track Catalog</span>
              </div>
              <h2 className="text-2xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-3xl lg:text-[2.5rem]">
                Popular Semester Modules
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/30 px-3 py-1 rounded-full">
              6 Core Engineering Tracks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourseCards.map((c, idx) => (
              <article
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl border-2 border-border hover:border-violet-500/50 bg-card p-6 sm:p-8 space-y-6 hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all shadow-xs"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-md border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold">
                      {c.code}
                    </span>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md border border-pink-500/30 bg-pink-500/10 text-pink-700 dark:text-pink-300">
                      {c.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold leading-snug tracking-tight text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {c.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <Link
                    href={`/portal/${c.moduleId}?mode=study`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 transition-all text-center shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                    <span>Study</span>
                  </Link>

                  <Link
                    href={`/portal/${c.moduleId}?mode=exam`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 px-3.5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-white hover:shadow-md hover:shadow-violet-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all text-center shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Exam</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Student Footer */}
      <StudentFooter />
    </div>
  );
}
