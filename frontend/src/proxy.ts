import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/user/')) {
    const isLoggedIn = request.cookies.get('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn.value !== '1') {
      const loginUrl = new URL(`/login?returnUrl=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*'],
};
