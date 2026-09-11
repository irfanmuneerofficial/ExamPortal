'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';
  const [isAuthenticated, setIsAuthenticated] = useState(isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    // Check if session cookie exists
    const hasSession = document.cookie
      .split('; ')
      .some((row) => row.startsWith('ep_admin_session=') && row.split('=')[1]?.trim() !== '');

    if (!hasSession) {
      router.replace(`/admin/login?redirectTo=${encodeURIComponent(pathname)}`);
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-xs text-muted-foreground">
        Verifying administrator authorization...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Persistent SaaS Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
