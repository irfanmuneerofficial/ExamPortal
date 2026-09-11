import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const sessionCookie = request.cookies.get('ep_admin_session');

    if (!sessionCookie || !sessionCookie.value || sessionCookie.value.trim() === '') {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and trying to view /admin/login, redirect to /admin dashboard
  if (pathname === '/admin/login') {
    const sessionCookie = request.cookies.get('ep_admin_session');
    if (sessionCookie && sessionCookie.value && sessionCookie.value.trim() !== '') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
