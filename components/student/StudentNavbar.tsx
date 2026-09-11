'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export function GeometricEmblem({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Exam Practice Portal Emblem"
    >
      <defs>
        <linearGradient id="emblem-funky-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" stroke="url(#emblem-funky-grad)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9.5" stroke="url(#emblem-funky-grad)" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="5" stroke="url(#emblem-funky-grad)" strokeWidth="1.2" />
      <ellipse cx="16" cy="16" rx="14" ry="5.5" stroke="url(#emblem-funky-grad)" strokeWidth="1.2" />
      <ellipse cx="16" cy="16" rx="5.5" ry="14" stroke="url(#emblem-funky-grad)" strokeWidth="1.2" />
      <ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(45 16 16)" stroke="url(#emblem-funky-grad)" strokeWidth="1.2" />
      <ellipse cx="16" cy="16" rx="14" ry="5.5" transform="rotate(-45 16 16)" stroke="url(#emblem-funky-grad)" strokeWidth="1.2" />
    </svg>
  );
}

interface StudentNavbarProps {
  breadcrumb?: {
    label: string;
    href?: string;
  }[];
}

export function StudentNavbar({ breadcrumb }: StudentNavbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-[1440px] mx-auto flex h-16 items-center justify-between px-6 sm:px-10 lg:px-12">
        {/* Brand with Gradient Emblem */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-foreground hover:opacity-90 transition-opacity group"
          >
            <GeometricEmblem className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Exam Practice <span className="bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Portal</span>
              </span>
              <span className="hidden sm:inline-flex text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400">
                25 MCQs / Module
              </span>
            </div>
          </Link>

          {breadcrumb && breadcrumb.length > 0 && (
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border-l border-border pl-4 font-mono">
              {breadcrumb.map((item, i) => (
                <React.Fragment key={i}>
                  <span className="text-border">/</span>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-semibold">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-foreground/80 font-mono">
          <a href="#exam-finder" className="flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group">
            <span>Academic Tracks</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-violet-500 transition-colors" />
          </a>
          <a href="#exam-finder" className="flex items-center gap-1 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group">
            <span>Semesters 1–4</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-violet-500 transition-colors" />
          </a>
          <a href="#featured-subjects" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Modules Catalog
          </a>
          <Link href="/explore" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            Curriculum Explorer
          </Link>
        </nav>

        {/* Right Actions: Theme Toggle, Admin, Start Practice */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-violet-600" />
            )}
          </button>

          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-mono font-medium text-foreground hover:text-violet-600 dark:hover:text-violet-400 transition-colors shadow-xs"
          >
            Admin
          </Link>

          <a
            href="#exam-finder"
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-mono font-bold uppercase tracking-wider hover:shadow-md hover:shadow-violet-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-xs"
          >
            Start Exam →
          </a>
        </div>
      </div>
    </header>
  );
}
