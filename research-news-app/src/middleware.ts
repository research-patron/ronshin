import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard)
  const path = request.nextUrl.pathname;

  // Define paths that require authentication
  const isProtectedPath = path.startsWith('/dashboard');

  // Define paths that are only for non-authenticated users
  const isAuthPath = path.startsWith('/login') || path.startsWith('/register');

  // Check if user has auth token (you'll need to implement proper auth check)
  const token = request.cookies.get('auth-token');

  // Redirect logic
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};