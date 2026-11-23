import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route protection middleware for HEC Worker Portal.
 * Ensures all operational workspaces and case management routes require an active worker session.
 * Rejects unauthenticated requests and redirects to /login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets, Next.js internal files, favicon, and auth APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check for worker authentication token
  const authToken =
    request.cookies.get('hec_worker_token')?.value ||
    request.cookies.get('hec_auth_token')?.value;

  const isAuthenticated = Boolean(authToken && authToken.trim() !== '');

  // 3. If accessing /login while already authenticated, redirect to /dashboard/manager
  if (pathname === '/login') {
    if (isAuthenticated) {
      const callbackUrl =
        request.nextUrl.searchParams.get('callbackUrl') || '/dashboard/manager';
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.next();
  }

  // 4. Protected routes: /dashboard, /applications, and the root '/'
  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/applications');

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
