'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Layers,
  BookOpen,
  Zap,
  Clock,
  Search,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { Program, Course, Module } from '@/lib/types';

interface CurriculumFilterProps {
  programs: Program[];
  courses: Course[];
  modules: Module[];
}

export function CurriculumFilter({
  programs,
  courses,
  modules,
}: CurriculumFilterProps) {
  // Step 1: Selected Program Track
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs[0]?.id || ''
  );

  // Step 2: Selected Semester (1 to 6) or 'ALL'
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');

  // Step 3: Selected Module (Course) or 'ALL'
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');

  // Step 4: Selected Module Part (1 to 4) or 'ALL'
  const [selectedPart, setSelectedPart] = useState<number | 'ALL'>('ALL');

  // Keyword search
  const [searchQuery, setSearchQuery] = useState('');

  // Semesters 1 to 6
  const availableSemesters = [1, 2, 3, 4, 5, 6];

  // Modules matching selected Program + Semester
  const hasCoursesForSelectedProg = useMemo(() => {
    return courses.some((c) => c.program_id === selectedProgramId);
  }, [courses, selectedProgramId]);

  const matchingCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchProg = hasCoursesForSelectedProg
        ? c.program_id === selectedProgramId
        : true;
      const matchSem =
        selectedSemester === 'ALL' || (c.semester || 1) === selectedSemester;
      return matchProg && matchSem;
    });
  }, [courses, selectedProgramId, selectedSemester, hasCoursesForSelectedProg]);

  // Filtered Module Parts list based on criteria + search
  const filteredModuleParts = useMemo(() => {
    return modules.filter((m) => {
      const parentCourse = courses.find((c) => c.id === m.course_id);
      if (!parentCourse) return false;

      // Filter 1: Program (if current program has courses, filter by it)
      if (hasCoursesForSelectedProg && parentCourse.program_id !== selectedProgramId) {
        return false;
      }

      // Filter 2: Semester
      if (
        selectedSemester !== 'ALL' &&
        (parentCourse.semester || 1) !== selectedSemester
      ) {
        return false;
      }

      // Filter 3: Module
      if (selectedCourseId !== 'ALL' && m.course_id !== selectedCourseId) {
        return false;
      }

      // Filter 4: Module Part (1-4)
      if (selectedPart !== 'ALL' && m.module_number !== selectedPart) {
        return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch =
          m.title.toLowerCase().includes(q) ||
          parentCourse.name.toLowerCase().includes(q) ||
          (parentCourse.code && parentCourse.code.toLowerCase().includes(q)) ||
          `part ${m.module_number}`.includes(q) ||
          `module ${m.module_number}`.includes(q) ||
          `sem ${parentCourse.semester}`.includes(q);
        if (!textMatch) return false;
      }

      return true;
    });
  }, [
    modules,
    courses,
    selectedProgramId,
    selectedSemester,
    selectedCourseId,
    selectedPart,
    searchQuery,
  ]);

  const currentProgram = programs.find((p) => p.id === selectedProgramId);

  return (
    <div className="space-y-10">
      {/* 4-Step Filter Scaffolding Card */}
      <div className="relative rounded-3xl border border-violet-500/20 bg-card/95 backdrop-blur-md p-6 sm:p-8 lg:p-10 space-y-8 shadow-xl shadow-violet-950/20 overflow-hidden">
        {/* Decorative student ambient glow dots */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Step 1: Track / Batch */}
        <div className="space-y-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/15 font-mono text-xs font-black text-violet-400 shadow-sm shadow-violet-500/20">
                01
              </span>
              <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-violet-400">
                ⚡ Step 1: Academic Track
              </span>
            </div>
            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
              {programs.length} Tracks Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {programs.map((prog) => {
              const isSelected = prog.id === selectedProgramId;

              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => {
                    setSelectedProgramId(prog.id);
                    setSelectedCourseId('ALL');
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-violet-400 shadow-lg shadow-violet-600/30 scale-[1.01]'
                      : 'bg-muted/60 border-border text-foreground hover:border-violet-500/40 hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-amber-300 animate-pulse' : 'bg-muted-foreground/50 group-hover:bg-violet-400'}`} />
                      {prog.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white backdrop-blur-sm'
                          : 'bg-card text-muted-foreground border border-border'
                      }`}
                    >
                      Official Batch
                    </span>
                  </div>
                  <p
                    className={`text-xs line-clamp-1 ${
                      isSelected ? 'text-violet-100' : 'text-muted-foreground'
                    }`}
                  >
                    {prog.description || 'Full semester curriculum'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Semester (1 to 6) */}
        <div className="space-y-4 pt-6 border-t border-border/80 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/15 font-mono text-xs font-black text-cyan-400 shadow-sm shadow-cyan-500/20">
                02
              </span>
              <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-cyan-400">
                🎯 Step 2: Choose Semester
              </span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              Semesters 1 through 6
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* All Semesters button */}
            <button
              type="button"
              onClick={() => setSelectedSemester('ALL')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                selectedSemester === 'ALL'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 border border-cyan-400 scale-[1.02]'
                  : 'bg-muted/70 text-foreground hover:bg-muted border border-border hover:border-cyan-500/40'
              }`}
            >
              ⭐ All Semesters
            </button>

            {/* Semester 1 - Emerald Mint */}
            <button
              type="button"
              onClick={() => setSelectedSemester(1)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                selectedSemester === 1
                  ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/30 border border-emerald-400 scale-[1.02]'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              🌱 Sem 1 (Foundations)
            </button>

            {/* Semester 2 - Electric Violet */}
            <button
              type="button"
              onClick={() => setSelectedSemester(2)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                selectedSemester === 2
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-400 scale-[1.02]'
                  : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/30'
              }`}
            >
              🚀 Sem 2 (Core Dev)
            </button>

            {/* Semester 3 - Neon Pink */}
            <button
              type="button"
              onClick={() => setSelectedSemester(3)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                selectedSemester === 3
                  ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30 border border-pink-400 scale-[1.02]'
                  : 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/30'
              }`}
            >
              🔥 Sem 3 (Enterprise)
            </button>

            {/* Semester 4 - Cyber Amber */}
            <button
              type="button"
              onClick={() => setSelectedSemester(4)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                selectedSemester === 4
                  ? 'bg-amber-500 text-amber-950 shadow-md shadow-amber-500/30 border border-amber-400 scale-[1.02]'
                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              ⚡ Sem 4 (Advanced)
            </button>

            {/* Semester 5 & 6 */}
            {[5, 6].map((sem) => {
              const isSelected = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30 border border-fuchsia-400 scale-[1.02]'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  Sem {sem}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3 & 4: Module & Module Part */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/80 relative">
          {/* Step 3: Module */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-500/40 bg-pink-500/15 font-mono text-xs font-black text-pink-400 shadow-sm shadow-pink-500/20">
                03
              </span>
              <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-pink-400">
                📚 Step 3: Select Subject / Module
              </span>
            </div>

            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-3 bg-muted/80 border border-border rounded-2xl text-sm text-foreground focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 font-medium transition-all"
            >
              <option value="ALL">
                ✨ All Modules ({matchingCourses.length} subjects found)
              </option>
              {matchingCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.semester ? `(Sem ${c.semester})` : ''} {c.code ? `[${c.code}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Step 4: Module Part */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 font-mono text-xs font-black text-amber-400 shadow-sm shadow-amber-500/20">
                04
              </span>
              <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-amber-400">
                🧩 Step 4: Module Part (1–4)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedPart('ALL')}
                className={`flex-1 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedPart === 'ALL'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 shadow-md shadow-amber-500/30 border border-amber-400 scale-[1.02]'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:border-amber-500/30 border border-border'
                }`}
              >
                All (1–4)
              </button>
              {[
                { partNum: 1, colorClass: 'hover:border-cyan-400', activeClass: 'bg-cyan-500 text-cyan-950 border-cyan-400 shadow-md shadow-cyan-500/20' },
                { partNum: 2, colorClass: 'hover:border-violet-400', activeClass: 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/20' },
                { partNum: 3, colorClass: 'hover:border-pink-400', activeClass: 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/20' },
                { partNum: 4, colorClass: 'hover:border-amber-400', activeClass: 'bg-amber-500 text-amber-950 border-amber-400 shadow-md shadow-amber-500/20' },
              ].map(({ partNum, colorClass, activeClass }) => (
                <button
                  key={partNum}
                  type="button"
                  onClick={() => setSelectedPart(partNum)}
                  className={`flex-1 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                    selectedPart === partNum
                      ? `${activeClass} scale-[1.02]`
                      : `bg-muted/70 text-muted-foreground hover:text-foreground ${colorClass} border-border`
                  }`}
                >
                  P{partNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/80 relative">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-violet-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search (e.g. HTML, Java, Python, SQL, Sem 1)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-muted/90 border border-violet-500/30 rounded-full text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 font-bold">
              {filteredModuleParts.length} Parts Ready
            </span>
          </div>
        </div>
      </div>

      {/* Module Parts Cards Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse" />
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Available Module Parts & Exam Tracks
            </h3>
          </div>
          <span className="font-mono text-xs font-bold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/30">
            Study or 25-Min Exam
          </span>
        </div>

        {filteredModuleParts.length === 0 ? (
          <div className="p-14 text-center rounded-3xl border-2 border-dashed border-violet-500/30 bg-card/60 space-y-4 shadow-sm">
            <HelpCircle className="w-12 h-12 text-violet-400 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-foreground">No Matching Module Parts Found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Try resetting your semester filter or search query above to browse all modules.
            </p>
            <button
              onClick={() => {
                setSelectedSemester('ALL');
                setSelectedCourseId('ALL');
                setSelectedPart('ALL');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-violet-300 hover:bg-violet-500 hover:text-white transition-all cursor-pointer shadow-md shadow-violet-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModuleParts.map((mod) => {
              const parentCourse = courses.find((c) => c.id === mod.course_id);
              const sem = parentCourse?.semester || 1;

              // Color accents by semester
              const semBadge =
                sem === 1
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : sem === 2
                  ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                  : sem === 3
                  ? 'bg-pink-500/15 text-pink-400 border-pink-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

              const partBadge =
                mod.module_number === 1
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : mod.module_number === 2
                  ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                  : mod.module_number === 3
                  ? 'bg-pink-500/15 text-pink-400 border-pink-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

              return (
                <article
                  key={mod.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card/90 backdrop-blur-sm p-6 sm:p-7 transition-all duration-300 hover:border-violet-500/60 hover:shadow-xl hover:shadow-violet-950/20 hover:-translate-y-1 space-y-6 overflow-hidden"
                >
                  {/* Subtle top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-4">
                    {/* Part & Semester Badges */}
                    <div className="flex items-center justify-between">
                      <span className={`rounded-xl border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${partBadge}`}>
                        Part {mod.module_number}
                      </span>
                      <span className={`rounded-xl border px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${semBadge}`}>
                        Sem {sem}
                      </span>
                    </div>

                    {/* Title & Parent Module */}
                    <div>
                      <h4 className="text-lg font-extrabold leading-snug tracking-tight text-foreground group-hover:text-violet-300 transition-colors line-clamp-2">
                        {mod.title}
                      </h4>
                      {parentCourse && (
                        <p className="mt-2 text-xs font-mono text-muted-foreground truncate flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          <span>{parentCourse.name}</span>
                          {parentCourse.code && (
                            <span className="text-violet-400/80 font-bold">[{parentCourse.code}]</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Launch Buttons with Punchy Styling */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/80 font-mono text-xs">
                    <Link
                      href={`/portal/${mod.id}?mode=study&programId=${parentCourse?.program_id}&courseId=${parentCourse?.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500 hover:text-emerald-950 transition-all text-center group-hover:border-emerald-500/60"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Study</span>
                    </Link>

                    <Link
                      href={`/portal/${mod.id}?mode=exam&programId=${parentCourse?.program_id}&courseId=${parentCourse?.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 px-3.5 py-2.5 font-bold uppercase tracking-wider text-white hover:brightness-110 transition-all text-center shadow-md shadow-violet-600/20 active:scale-[0.98]"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Exam</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
