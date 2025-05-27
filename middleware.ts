import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from './lib/security-headers';

/**
 * Security Middleware for Romanian ID Processing PWA
 * Implements additional security measures and HTTPS enforcement
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname, protocol } = request.nextUrl;

  // Generate nonce for CSP
  const nonce = generateNonce();

  // HTTPS enforcement in production
  if (process.env.NODE_ENV === 'production' && protocol === 'http:') {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Security headers for specific routes
  if (pathname === '/sw.js') {
    // Additional service worker security
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Service-Worker-Allowed', '/');
  }

  if (pathname.startsWith('/api/')) {
    // API security headers
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Access-Control-Allow-Origin', 'same-origin');
  }

  if (pathname === '/manifest.json') {
    // PWA manifest security
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Security headers for all responses
  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Powered-By', 'Romanian ID Processing PWA');

  // CSP nonce for inline scripts (if needed)
  if (request.headers.get('accept')?.includes('text/html')) {
    response.headers.set('X-CSP-Nonce', nonce);
  }

  // Rate limiting headers (basic implementation)
  const clientIP =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  response.headers.set('X-Client-IP', clientIP);

  // Security logging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔒 Security Middleware: ${request.method} ${pathname} from ${clientIP}`
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
