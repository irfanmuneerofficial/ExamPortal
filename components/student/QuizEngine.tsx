'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Question,
  Module,
  QuizMode,
  QuizSubmission,
} from '@/lib/types';
import { QuizResults } from '@/components/student/QuizResults';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  Send,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';

interface QuizEngineProps {
  moduleData: Module;
  initialQuestions: Question[];
  initialMode: QuizMode;
  programId?: string;
  courseId?: string;
}

// Timer Component
function Timer({
  initialSeconds,
  onExpire,
}: {
  initialSeconds: number;
  onExpire: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 300; // < 5 minutes

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono text-xs transition-all ${
        isUrgent
          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-black animate-pulse shadow-lg shadow-rose-500/30'
          : 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-md shadow-amber-500/20'
      }`}
    >
      <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`} />
      <span className="tracking-wider">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export function QuizEngine({
  moduleData,
  initialQuestions,
  initialMode,
  programId,
  courseId,
}: QuizEngineProps) {
  const router = useRouter();
  const [mode, setMode] = useState<QuizMode>(initialMode);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(userAnswers).length;

  const handleSelectOption = (optionText: string) => {
    if (!currentQuestion) return;

    if (mode === 'study' && userAnswers[currentQuestion.id]) {
      return;
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionText,
    }));
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
    setIsPaletteOpen(false);
  };

  const calculateResults = (): QuizSubmission => {
    let score = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correct_answer) {
        score++;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const timeSpentSeconds = Math.floor((Date.now() - startTime) / 1000);

    return {
      moduleId: moduleData.id,
      moduleTitle: moduleData.title,
      courseName: moduleData.courses?.name || 'Academic Subject',
      mode,
      totalQuestions,
      score,
      percentage,
      passed: percentage >= 60,
      timeSpentSeconds,
      userAnswers,
      submittedAt: new Date().toISOString(),
    };
  };

  const handleSubmitExam = () => {
    setIsSubmitModalOpen(false);
    const results = calculateResults();

    try {
      const historyItem = {
        id: `hist-${Date.now()}`,
        moduleId: moduleData.id,
        moduleTitle: moduleData.title,
        courseName: moduleData.courses?.name || 'Academic Subject',
        mode,
        score: results.score,
        totalQuestions: results.totalQuestions,
        percentage: results.percentage,
        passed: results.passed,
        date: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('examportal_practice_history') || '[]');
      const updated = [historyItem, ...existing.filter((h: any) => h.moduleId !== moduleData.id)].slice(0, 8);
      localStorage.setItem('examportal_practice_history', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save history to localStorage', err);
    }

    setSubmission(results);
  };

  const handleRetake = (newMode: QuizMode) => {
    setMode(newMode);
    setUserAnswers({});
    setMarkedForReview({});
    setCurrentIndex(0);
    setSubmission(null);
    setStartTime(Date.now());
  };

  if (totalQuestions === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl border border-border bg-card text-center space-y-4">
        <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">No Questions in this Module Part</h2>
        <p className="text-xs font-mono text-muted-foreground">
          This module part currently has no active questions in the question bank.
        </p>
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-full bg-foreground font-mono text-xs font-semibold uppercase tracking-wider text-background hover:opacity-90 transition-opacity"
        >
          Return to Module
        </button>
      </div>
    );
  }

  if (submission) {
    return (
      <QuizResults
        submission={submission}
        questions={questions}
        onRetake={handleRetake}
        programId={programId}
        courseId={courseId}
      />
    );
  }

  const selectedAnswer = currentQuestion ? userAnswers[currentQuestion.id] : undefined;
  const isAnswered = Boolean(selectedAnswer);
  const isMarked = currentQuestion ? Boolean(markedForReview[currentQuestion.id]) : false;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Top Floating Control Bar */}
      <div className="sticky top-20 z-30 p-4 sm:p-5 rounded-3xl bg-card/90 backdrop-blur-xl border border-violet-500/20 shadow-xl shadow-violet-950/20 flex items-center justify-between gap-4">
        {/* Module details */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl bg-muted/80 hover:bg-violet-500/15 text-muted-foreground hover:text-violet-300 border border-border hover:border-violet-500/30 transition-all cursor-pointer"
            title="Exit to Module"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-[10px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${
                  mode === 'exam'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {mode === 'exam' ? '⏱️ Timed Exam' : '💡 Study Mode'}
              </span>
              <span className="text-xs font-bold text-foreground hidden sm:inline">
                Part {moduleData.module_number}: {moduleData.title}
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              Question <strong className="text-violet-400 font-black">{currentIndex + 1}</strong> of {totalQuestions}
            </p>
          </div>
        </div>

        {/* Center Timer for Exam Mode or Instant Tag for Study */}
        {mode === 'exam' ? (
          <Timer initialSeconds={1500} onExpire={handleSubmitExam} />
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold shadow-sm shadow-emerald-500/10">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            <span>Instant Feedback Mode</span>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="lg:hidden p-2 rounded-xl bg-muted text-foreground border border-border hover:border-violet-400 cursor-pointer"
            title="Question Grid"
          >
            <Menu className="w-4 h-4" />
          </button>

          {mode === 'exam' && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 font-mono text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-violet-600/30 active:scale-[0.98] cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit</span>
            </button>
          )}

          {mode === 'study' && (
            <button
              onClick={() => handleRetake('exam')}
              className="px-4 py-2.5 rounded-2xl border border-violet-500/30 bg-violet-500/10 font-mono text-xs font-bold text-violet-300 hover:bg-violet-500 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-violet-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Switch to Exam</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Question Card + Palette */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Question Area (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative p-6 sm:p-8 rounded-3xl border border-violet-500/20 bg-card/95 backdrop-blur-sm space-y-6 shadow-xl shadow-violet-950/15 overflow-hidden">
            {/* Ambient accent bar on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500" />

            {/* Header controls inside card */}
            <div className="flex items-center justify-between gap-4 border-b border-border/80 pb-4 font-mono text-xs">
              <span className="font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300">
                Question {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}
              </span>

              {mode === 'exam' && (
                <button
                  onClick={toggleMarkForReview}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    isMarked
                      ? 'border-amber-400 bg-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/30'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isMarked ? '★ Marked for Review' : 'Mark for Review'}</span>
                </button>
              )}
            </div>

            {/* Question Text */}
            <div>
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-relaxed tracking-tight">
                {currentQuestion.question_text}
              </h2>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedAnswer === opt;
                const letter = String.fromCharCode(65 + oIdx);

                // Punchy letter badge styles per option index
                const letterStyles = [
                  'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                  'bg-violet-500/15 text-violet-400 border-violet-500/30',
                  'bg-pink-500/15 text-pink-400 border-pink-500/30',
                  'bg-amber-500/15 text-amber-400 border-amber-500/30',
                ];
                const activeLetterStyle = letterStyles[oIdx % letterStyles.length];

                let optionContainerStyle =
                  'bg-muted/40 border-border text-foreground hover:border-violet-500/40 hover:bg-muted/80';

                if (mode === 'study' && isAnswered) {
                  const isThisCorrect = opt === currentQuestion.correct_answer;
                  if (isThisCorrect) {
                    optionContainerStyle =
                      'border-emerald-500 bg-emerald-500/15 text-emerald-200 ring-2 ring-emerald-500/50 shadow-md shadow-emerald-500/20 font-bold';
                  } else if (isSelected && !isThisCorrect) {
                    optionContainerStyle =
                      'border-rose-500/60 bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/40 line-through';
                  }
                } else if (isSelected) {
                  optionContainerStyle =
                    'border-violet-500 bg-violet-500/15 text-white ring-2 ring-violet-500/50 shadow-lg shadow-violet-600/20 font-bold';
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer group ${optionContainerStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs border transition-transform group-hover:scale-105 ${
                          isSelected
                            ? 'bg-white text-violet-950 border-white font-black shadow-sm'
                            : activeLetterStyle
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="text-sm sm:text-base leading-relaxed font-medium">
                        {opt}
                      </span>
                    </div>

                    {mode === 'study' && isAnswered && (
                      <div className="flex-shrink-0 font-mono text-xs">
                        {opt === currentQuestion.correct_answer ? (
                          <span className="flex items-center gap-1.5 text-emerald-950 px-3 py-1 rounded-xl bg-emerald-400 border border-emerald-300 font-black shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                          </span>
                        ) : isSelected ? (
                          <span className="flex items-center gap-1.5 text-rose-300 px-3 py-1 rounded-xl border border-rose-500/30 bg-rose-500/20 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> Incorrect
                          </span>
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Study Mode: Instant Explanation */}
            {mode === 'study' && isAnswered && currentQuestion.explanation && (
              <div className="p-5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-pink-500/10 to-amber-500/10 space-y-2 animate-slide-up text-xs shadow-inner">
                <div className="flex items-center gap-2 font-mono font-black uppercase tracking-wider text-violet-300">
                  <HelpCircle className="w-4 h-4 text-pink-400 animate-pulse" />
                  <span>Curriculum Explanation</span>
                </div>
                <p className="text-foreground/90 leading-relaxed font-normal text-sm">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-border/80 font-mono text-xs">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-border bg-muted/80 text-foreground hover:bg-violet-500/15 hover:border-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <span className="text-muted-foreground hidden sm:inline font-bold">
                Answered: <strong className="text-violet-400">{answeredCount}</strong> / {totalQuestions}
              </span>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 font-bold uppercase tracking-wider text-white hover:brightness-110 shadow-md shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : mode === 'exam' ? (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 font-black uppercase tracking-wider text-white hover:brightness-110 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                >
                  <span>Submit Exam</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    const results = calculateResults();
                    setSubmission(results);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-black uppercase tracking-wider text-white hover:brightness-110 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <span>Finish Study</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div
          className={`lg:block ${
            isPaletteOpen ? 'block' : 'hidden'
          } p-6 rounded-3xl border border-violet-500/20 bg-card/95 backdrop-blur-sm space-y-4 shadow-xl shadow-violet-950/10`}
        >
          <div className="flex items-center justify-between border-b border-border/80 pb-3">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Palette ({totalQuestions})
            </span>
            {isPaletteOpen && (
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="lg:hidden p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Palette Grid with Punchy Status Pills */}
          <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
            {questions.map((q, qIdx) => {
              const ans = userAnswers[q.id];
              const marked = markedForReview[q.id];
              const isCurr = qIdx === currentIndex;

              let btnStyle = 'bg-muted/70 text-muted-foreground border-border hover:border-violet-400 hover:text-foreground';

              if (ans) {
                btnStyle = 'bg-emerald-500 text-emerald-950 border-emerald-400 font-black shadow-xs shadow-emerald-500/30';
              } else if (marked) {
                btnStyle = 'border-amber-400 bg-amber-500/15 text-amber-400 font-bold';
              }

              if (isCurr) {
                btnStyle += ' ring-2 ring-violet-400 border-violet-400 scale-105 font-black shadow-md shadow-violet-500/30';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpTo(qIdx)}
                  className={`h-8 rounded-xl border text-xs font-mono transition-all duration-150 relative flex items-center justify-center cursor-pointer ${btnStyle}`}
                >
                  <span>{qIdx + 1}</span>
                  {marked && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-3 border-t border-border/80 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs shadow-emerald-500/30" />
              <span className="text-foreground font-semibold">Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-md bg-muted border border-border" />
              <span>Unanswered ({totalQuestions - answeredCount})</span>
            </div>
            {mode === 'exam' && (
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-md border border-amber-400 bg-amber-500/20" />
                <span className="text-amber-400 font-semibold">Marked for Review</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setIsSubmitModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card border border-violet-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5 animate-slide-up text-center overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500" />

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-foreground tracking-tight">Submit Examination?</h3>

            <div className="p-4 rounded-2xl border border-violet-500/20 bg-muted/60 space-y-2 font-mono text-xs text-left">
              <div className="flex justify-between text-muted-foreground">
                <span>Total Questions:</span>
                <strong className="text-foreground">{totalQuestions}</strong>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Answered:</span>
                <strong>{answeredCount}</strong>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Unanswered:</span>
                <strong>{totalQuestions - answeredCount}</strong>
              </div>
            </div>

            <p className="font-mono text-xs text-muted-foreground">
              Once confirmed, your answers will be locked and graded instantly with a full analytics report.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl border border-border bg-muted/80 text-foreground hover:bg-muted transition-colors font-bold cursor-pointer"
              >
                Back to Exam
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 font-black uppercase tracking-wider text-white hover:brightness-110 transition-all shadow-lg shadow-violet-600/30 cursor-pointer"
              >
                Confirm & Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
