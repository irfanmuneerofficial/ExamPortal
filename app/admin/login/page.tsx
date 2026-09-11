'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid credentials. Access denied.');
        setLoading(false);
        return;
      }

      // Successful login
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10 space-y-6">
      {/* Brand & Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
          <span className="h-9 w-9 bg-gradient-to-tr from-violet-600 to-pink-600 text-white flex items-center justify-center rounded-xl font-mono font-black text-xs shadow-md shadow-violet-600/30">
            EP
          </span>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Exam Practice Portal
          </span>
        </Link>

        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Admin Portal Authentication
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          Enter authorized administrator credentials to access management console.
        </p>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl border border-violet-500/30 bg-card/95 backdrop-blur-md p-6 sm:p-8 space-y-6 shadow-2xl shadow-violet-950/20 overflow-hidden relative">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500" />

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 flex items-start gap-3 text-xs font-mono text-rose-400 animate-slide-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="block font-mono text-xs font-black uppercase tracking-wider text-foreground">
              Admin Username / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter admin email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted/80 border border-border/80 rounded-2xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-xs font-black uppercase tracking-wider text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-violet-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted/80 border border-border/80 rounded-2xl font-mono text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 font-mono text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 active:scale-[0.98] cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-border/80 flex items-center justify-center gap-2 text-center text-xs font-mono text-muted-foreground">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Restricted system. Unauthorized access prohibited.</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <span>← Return to Student Portal</span>
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="font-mono text-xs text-muted-foreground">Loading authentication...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
