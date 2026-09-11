'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { StudentPracticeHistory } from '@/lib/types';

export function StudentPracticeHistoryWidget() {
  const [history, setHistory] = useState<StudentPracticeHistory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('examportal_practice_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Failed reading history from localStorage', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  if (!loaded) return null;

  if (history.length === 0) {
    return (
      <div className="relative rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Exam Readiness Scaffolding
          </p>
          <h4 className="text-xl font-semibold tracking-tight text-foreground">
            Start Your First Practice Session
          </h4>
          <p className="text-sm text-muted-foreground max-w-xl">
            Choose any subject module below in Study Mode for instant option explanations or Timed Exam Mode for 25-minute test simulation.
          </p>
        </div>

        <a
          href="#exam-finder"
          className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-90"
        >
          <span>Select Track</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs font-bold text-foreground">
            ★
          </span>
          <h3 className="font-semibold text-foreground text-base sm:text-lg tracking-tight">
            Recent Practice & Test Submissions
          </h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          Local Session
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {history.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl border border-border bg-muted/60 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-background text-foreground font-semibold">
                  {item.mode === 'exam' ? 'Timed Exam' : 'Study Mode'}
                </span>

                <span
                  className={`font-mono text-xs font-bold ${
                    item.passed ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {item.percentage}% {item.passed ? '✓' : '✗'}
                </span>
              </div>

              <h4 className="font-medium text-foreground text-sm line-clamp-2 leading-snug">
                {item.moduleTitle}
              </h4>
              <p className="font-mono text-xs text-muted-foreground mt-1 truncate">
                {item.courseName}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between font-mono text-xs">
              <span className="text-muted-foreground">
                Score: {item.score}/{item.totalQuestions}
              </span>

              <Link
                href={`/portal/${item.moduleId}?mode=${item.mode}`}
                className="text-foreground hover:text-muted-foreground font-semibold flex items-center gap-1"
              >
                <span>Retake</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
