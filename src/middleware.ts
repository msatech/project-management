import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/session';

const protectedRoutes = ['/dashboard', '/organization']; // Add base protected routes
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await getSession();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname.includes('/app');
  const isPublicRoute = publicRoutes.includes(pathname);

  if (!session && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (session && isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone();
    // Redirect to a default dashboard or the user's last project
    // For now, let's redirect to a generic dashboard path
    const orgSlug = session.user.organizations?.[0]?.organization.slug;
    if (orgSlug) {
      url.pathname = `/app/${orgSlug}`;
    } else {
      url.pathname = '/app/create-organization';
    }
    
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