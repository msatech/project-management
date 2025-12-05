'use server';

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionPayload } from './lib/session.edge';

const protectedRoutes = ['/app', '/dashboard', '/organization'];
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add the pathname to the request headers for use in layouts
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-pathname', pathname);

  const sessionPayload = await getSessionPayload();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!sessionPayload && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (sessionPayload && isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone();
    // Redirect to the base /app path. The app layout will handle the rest.
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
