'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  variant?: 'pill' | 'icon' | 'select';
}

export function ThemeToggle({
  showLabel = false,
  className = '',
  variant = 'icon',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-full border border-border bg-muted/50 ${className}`} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (variant === 'select') {
    return (
      <div className={`flex items-center p-1 rounded-xl bg-muted border border-border text-xs font-mono ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            theme === 'light'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Light Mode"
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
            theme === 'system'
              ? 'bg-foreground text-background font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="System Sync"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto</span>
        </button>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/80 hover:bg-muted text-foreground transition-colors font-mono text-xs ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative p-2 rounded-full border border-border bg-muted/80 hover:bg-border text-foreground transition-all hover:scale-105 active:scale-95 ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 animate-fade-in" />
      )}
      {showLabel && (
        <span className="ml-2 font-mono text-xs">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}
