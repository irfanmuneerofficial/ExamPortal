import React from 'react';
import Link from 'next/link';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 text-center transition-colors">
      <div className="max-w-md space-y-5 bg-card border border-border p-8 rounded-3xl shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-muted border border-border text-foreground flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">404 - Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The curriculum, module, or exam portal page you were looking for could not be found.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-mono font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
