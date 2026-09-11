import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  response.cookies.set('ep_admin_session', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
  });

  return response;
}
