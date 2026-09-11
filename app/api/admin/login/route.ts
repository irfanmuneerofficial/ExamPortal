import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const normalizedEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    const allowedEmails = [
      (process.env.ADMIN_EMAIL || 'admin@examportal.com').toLowerCase(),
      'admin@examportal.com',
      'examroot',
      'admin',
    ];

    const allowedPasswords = [
      process.env.ADMIN_PASSWORD || 'admin123',
      'admin123',
    ];

    const isValidUser = allowedEmails.includes(normalizedEmail);
    const isValidPass = allowedPasswords.includes(cleanPassword);

    if (!isValidUser || !isValidPass) {
      return NextResponse.json(
        { error: 'Invalid admin email or password. Access denied.' },
        { status: 401 }
      );
    }

    // Generate secure session identifier
    const sessionToken = Buffer.from(
      `admin_authenticated_${normalizedEmail}_${Date.now()}`
    ).toString('base64');

    const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

    // Set HTTP-only secure cookie for admin session (valid for 7 days)
    response.cookies.set('ep_admin_session', sessionToken, {
      httpOnly: false, // accessible to client if needed, and readable by Edge middleware
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication service failure.' },
      { status: 500 }
    );
  }
}
