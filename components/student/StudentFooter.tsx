import React from 'react';
import Link from 'next/link';

export function StudentFooter() {
  return (
    <footer className="relative border-t border-border/80 bg-card/90 backdrop-blur-md overflow-hidden">
      {/* Funky candy top border stripe */}
      <div className="hatched-stripe-bar" />

      <div className="py-10 px-6 sm:px-10 lg:px-14 max-w-7xl mx-auto space-y-6 font-mono text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Copyright */}
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="font-black text-sm tracking-tight text-foreground">
                © 2026 ExamPractisePortal.
              </span>
              <span className="text-muted-foreground font-semibold">
                All rights reserved.
              </span>
            </div>
            <p className="text-amber-400 font-bold tracking-wide">
              Copying? Our lawyers are faster than you! 😈
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-muted-foreground font-semibold">
            <Link href="/#exam-finder" className="hover:text-violet-400 transition-colors">
              Exam Finder
            </Link>
            <Link href="/#featured-subjects" className="hover:text-pink-400 transition-colors">
              Modules
            </Link>
            <Link href="/explore" className="hover:text-cyan-400 transition-colors">
              Curriculum Explorer
            </Link>
            <Link href="/admin" className="hover:text-amber-400 transition-colors">
              Admin Console
            </Link>
          </div>
        </div>

        {/* Designer Credit Bar */}
        <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-muted-foreground text-[11px]">
          <div className="flex items-center gap-1.5">
            <span>Website designed by</span>
            <a
              href="https://irfanmuneerofficial.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-violet-400 hover:text-pink-400 underline underline-offset-2 transition-colors"
            >
              {`{Irfan Muneer}`}
            </a>
          </div>

          <span className="text-[10px] text-muted-foreground/80">
            Precision Tech Practice Platform • 25 MCQs / Module Standard
          </span>
        </div>
      </div>
    </footer>
  );
}
