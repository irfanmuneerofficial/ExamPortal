'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Clock,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, QuizSubmission } from '@/lib/types';

interface QuizResultsProps {
  submission: QuizSubmission;
  questions: Question[];
  onRetake: (mode: 'study' | 'exam') => void;
  programId?: string;
  courseId?: string;
}

export function QuizResults({
  submission,
  questions,
  onRetake,
}: QuizResultsProps) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');

  useEffect(() => {
    if (submission.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        // confetti fallback
      }
    }
  }, [submission.passed]);

  const minutesSpent = Math.floor(submission.timeSpentSeconds / 60);
  const secondsSpent = submission.timeSpentSeconds % 60;
  const timeFormatted = `${minutesSpent}m ${secondsSpent}s`;

  const filteredQuestions = questions.filter((q) => {
    const userAns = submission.userAnswers[q.id];
    const isCorrect = userAns === q.correct_answer;
    const isUnanswered = !userAns;

    if (filter === 'correct') return isCorrect;
    if (filter === 'incorrect') return !isCorrect && !isUnanswered;
    if (filter === 'unanswered') return isUnanswered;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Score Header Card */}
      <div className="relative p-8 sm:p-12 rounded-3xl border border-violet-500/30 bg-card/95 backdrop-blur-md text-center space-y-6 shadow-2xl shadow-violet-950/20 overflow-hidden">
        {/* Candy stripe bar on top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 via-violet-500 via-pink-500 to-amber-400" />
        
        {/* Glow behind score */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-3 relative">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 font-mono text-xs font-black uppercase tracking-wider text-violet-300 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Official Exam Practice Scorecard</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            {submission.passed ? (
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                🎉 Assessment Passed!
              </span>
            ) : (
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                💪 Keep Practicing!
              </span>
            )}
          </h2>

          <div className="flex items-center justify-center gap-3 my-2">
            <span
              className={`font-mono text-6xl sm:text-7xl font-black tracking-tight px-6 py-2 rounded-3xl border ${
                submission.passed
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-lg shadow-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-lg shadow-amber-500/20'
              }`}
            >
              {submission.percentage}%
            </span>
          </div>

          <p className="font-mono text-xs text-muted-foreground font-semibold">
            Minimum passing grade: 60% •{' '}
            <strong className={submission.passed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {submission.passed ? 'Certified Competence Achieved' : 'Review Explanations Below to Level Up'}
            </strong>
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-3.5 border-t border-border/80 pt-6 font-mono text-xs relative">
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
            <p className="text-emerald-400 font-bold uppercase tracking-wider">Correct</p>
            <p className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              {submission.score} <span className="text-xs text-muted-foreground font-normal">/ {submission.totalQuestions}</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-cyan-400 font-bold uppercase tracking-wider">Time Spent</p>
            <p className="text-2xl sm:text-3xl font-black text-foreground mt-1">
              {timeFormatted}
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-violet-500/30 bg-violet-500/10">
            <p className="text-violet-400 font-bold uppercase tracking-wider">Mode</p>
            <p className="text-2xl sm:text-3xl font-black text-foreground mt-1 uppercase">
              {submission.mode}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative">
          <button
            onClick={() => onRetake('exam')}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 px-6 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-white hover:brightness-110 shadow-lg shadow-violet-600/30 transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Exam Mode</span>
          </button>

          <button
            onClick={() => onRetake('study')}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-500 hover:text-emerald-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <span>Study with Instant Feedback</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-muted/80 px-5 py-3.5 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>

      {/* Breakdown and Filter Pills */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <h3 className="font-extrabold text-xl text-foreground tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
            Question-by-Question Audit ({filteredQuestions.length})
          </h3>

          <div className="flex items-center gap-1.5 rounded-2xl bg-muted/80 p-1.5 border border-border/80 font-mono text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                filter === 'all'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                filter === 'correct'
                  ? 'bg-emerald-500 text-emerald-950 shadow-md shadow-emerald-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Correct ({submission.score})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                filter === 'incorrect'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Incorrect ({submission.totalQuestions - submission.score})
            </button>
          </div>
        </div>

        {/* Questions Detailed Review */}
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const userAns = submission.userAnswers[q.id];
            const isCorrect = userAns === q.correct_answer;
            const isUnanswered = !userAns;

            return (
              <div
                key={q.id}
                className="p-6 rounded-3xl border border-violet-500/20 bg-card/95 backdrop-blur-sm space-y-4 shadow-sm hover:border-violet-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 font-mono text-xs font-black text-violet-300 flex-shrink-0 mt-0.5">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </span>
                    <h4 className="font-bold text-foreground text-sm sm:text-base leading-relaxed">
                      {q.question_text}
                    </h4>
                  </div>

                  <span
                    className={`font-mono text-xs uppercase px-3 py-1 rounded-xl border font-black flex-shrink-0 ${
                      isCorrect
                        ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-xs shadow-emerald-500/20'
                        : isUnanswered
                        ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                        : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isCorrect ? 'Correct ✓' : isUnanswered ? 'Skipped' : 'Incorrect ✗'}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium">
                  {q.options.map((opt, optIdx) => {
                    const isUserChoice = opt === userAns;
                    const isRightAnswer = opt === q.correct_answer;

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                          isRightAnswer
                            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-bold ring-1 ring-emerald-500/40'
                            : isUserChoice
                            ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 line-through ring-1 ring-rose-500/40'
                            : 'border-border/80 bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-black px-1.5 py-0.5 rounded bg-black/20">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </span>

                        {isRightAnswer && (
                          <span className="font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-emerald-400 text-emerald-950">
                            Answer
                          </span>
                        )}
                        {isUserChoice && !isRightAnswer && (
                          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-300">
                            You Chose
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation */}
                {q.explanation && (
                  <div className="p-4 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-pink-500/10 to-amber-500/10 text-xs text-foreground/90 flex items-start gap-3">
                    <HelpCircle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-mono font-black text-violet-300 uppercase tracking-wider">Explanation: </span>
                      <span className="leading-relaxed">{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
