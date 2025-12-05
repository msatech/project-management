import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionPayload } from './lib/session.edge';

const protectedRoutes = ['/dashboard', '/organization']; // Add base protected routes
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionPayload = await getSessionPayload();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname.includes('/app');
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!sessionPayload && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (sessionPayload && isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone();
    // Because middleware can't access the database, we can't do a smart redirect
    // to the user's first project. We'll redirect to a generic app path.
    // The page itself will handle the final redirect.
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
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
