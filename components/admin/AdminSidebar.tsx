'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Layers,
  HelpCircle,
  LogOut,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Programs', href: '/admin/programs', icon: GraduationCap },
    { label: 'Modules', href: '/admin/courses', icon: BookOpen },
    { label: 'Module Parts', href: '/admin/modules', icon: Layers },
    { label: 'Question Bank', href: '/admin/questions', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // fallback to cookie clearing
    }
    document.cookie = 'ep_admin_session=; path=/; max-age=0; SameSite=Lax';
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-40 transition-colors">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="h-7 w-7 shrink-0 bg-foreground text-background flex items-center justify-center rounded-lg font-mono font-bold text-xs shadow-xs">
            EP
          </span>
          <div>
            <h1 className="font-bold text-foreground tracking-tight text-sm flex items-center gap-1.5">
              Exam Practice <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground font-semibold">Admin</span>
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground">Practice Portal Ops</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-foreground text-background font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
          Public Surface
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </div>
          <span className="text-[10px] border border-border bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-medium">Live</span>
        </Link>
      </div>

      {/* Footer Theme Toggle, Profile & Logout */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border text-foreground font-mono text-xs transition-colors"
        >
          <span className="text-muted-foreground">Appearance</span>
          <span className="flex items-center gap-1.5 text-foreground font-semibold capitalize">
            {resolvedTheme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </>
            )}
          </span>
        </button>

        <div className="flex items-center justify-between p-2 rounded-xl bg-muted border border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs">
              A
            </div>
            <div>
              <p className="font-semibold text-xs text-foreground">Admin Session</p>
              <p className="font-mono text-[10px] text-muted-foreground">Active</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg hover:bg-border/80 text-muted-foreground hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
