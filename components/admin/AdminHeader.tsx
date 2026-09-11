'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { checkPostgresHealth, PostgresHealthStatus } from '@/lib/db';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function AdminHeader() {
  const pathname = usePathname();
  const [dbStatus, setDbStatus] = useState<PostgresHealthStatus | null>(null);

  useEffect(() => {
    checkPostgresHealth().then(setDbStatus).catch(() => null);
  }, [pathname]);

  const getBreadcrumb = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'Dashboard Overview';
    const section = parts[1];
    if (section === 'courses') return 'Modules';
    if (section === 'modules') return 'Module Parts';
    if (section === 'programs') return 'Programs';
    if (section === 'questions') return 'Question Bank';
    return section.charAt(0).toUpperCase() + section.slice(1);
  };

  return (
    <header className="h-16 bg-background/95 backdrop-blur border-b border-border sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider transition-colors">
          Admin
        </Link>
        <span className="text-border">/</span>
        <span className="text-foreground font-semibold uppercase tracking-wider">{getBreadcrumb()}</span>
      </div>

      {/* Right Controls: Database Badge, Theme Toggle, Student Portal */}
      <div className="flex items-center gap-3">
        {/* Database Status Indicator */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border font-mono text-[11px]"
          title={dbStatus?.message || 'Database status'}
        >
          {dbStatus?.hasTables ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-foreground font-medium">PostgreSQL Live</span>
            </>
          ) : dbStatus?.isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-foreground font-medium">Schema Pending</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-foreground font-medium">Local Mode</span>
            </>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <ThemeToggle variant="icon" />

        {/* View Student Portal */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted hover:bg-border/80 text-foreground font-mono text-xs font-medium transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Student View</span>
        </Link>
      </div>
    </header>
  );
}
