import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const refreshToken = request.nextUrl.searchParams.get('refreshToken');
  const isProd = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();
  
  if (token) {
    cookieStore.set('token', token, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 15 * 60 });
    cookieStore.set('isLoggedIn', '1', { httpOnly: false, secure: isProd, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
  }
  if (refreshToken) {
    cookieStore.set('refreshToken', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '?loggedIn=1';
  
  return NextResponse.redirect(loginUrl, 303);
}
