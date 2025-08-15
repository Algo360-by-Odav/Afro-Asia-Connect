import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that are considered public and don't require authentication
const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_PATHS = ['/auth']; // Add other public paths like '/', '/about', etc., if needed

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests for static files and Next.js specific paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') || // Exclude API routes from this middleware logic if they have their own auth
    pathname.startsWith('/static') ||
    PUBLIC_FILE.test(pathname) ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get('token')?.value;

  // If trying to access a protected route (e.g., /dashboard) without a token
  if (!token && pathname.startsWith('/dashboard')) {
    // Redirect to login page, preserving the intended destination for after login
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated (has token) and tries to access the homepage, redirect to dashboard
  if (token && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is authenticated (has token) and tries to access /auth page
  if (token && pathname === '/auth') {
    const redirectPath = request.nextUrl.searchParams.get('redirect');
    if (redirectPath) {
      // Ensure the redirectPath is a relative path within the application to prevent open redirect vulnerabilities
      if (redirectPath.startsWith('/')) {
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } else {
        // If redirectPath is not a valid relative path, default to /dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // If no redirect param, default to /dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // If none of the above, allow the request to proceed
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This can be simplified if the logic above correctly handles public files and API routes.
     * For now, let's make it broad and refine if needed.
     */
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
    // Or, more simply, apply to specific routes if that's preferred initially:
     '/dashboard/:path*', '/login', '/signup'
  ],
};
