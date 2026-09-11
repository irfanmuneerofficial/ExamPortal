'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  initialSeconds?: number; // default 1500 (25 mins)
  onExpire: () => void;
  isPaused?: boolean;
}

export function Timer({
  initialSeconds = 1500,
  onExpire,
  isPaused = false,
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (isPaused) return;

    if (secondsLeft <= 0) {
      onExpire();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, isPaused, onExpire]);

  const minutes = Math.floor(secondsLeft / 60);
  const remainingSeconds = secondsLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;

  const isUrgent = secondsLeft <= 300; // Under 5 minutes
  const isCritical = secondsLeft <= 60; // Under 1 minute

  const percent = Math.max(0, (secondsLeft / initialSeconds) * 100);

  return (
    <div
      className={`px-4 py-2 rounded-2xl border transition-all flex items-center gap-3 ${
        isCritical
          ? 'bg-rose-500/10 border-rose-500/50 text-rose-600 dark:text-rose-400 animate-pulse'
          : isUrgent
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
          : 'bg-card border-border text-foreground'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-rose-500' : 'text-amber-500'}`} />
        ) : (
          <Clock className="w-4 h-4 text-foreground" />
        )}
        <div className="text-left">
          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider block -mb-1">
            Time Left
          </span>
          <span className="font-mono text-base font-bold tracking-tight">
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-12 h-1.5 bg-muted border border-border rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isCritical
              ? 'bg-rose-500'
              : isUrgent
              ? 'bg-amber-500'
              : 'bg-foreground'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
