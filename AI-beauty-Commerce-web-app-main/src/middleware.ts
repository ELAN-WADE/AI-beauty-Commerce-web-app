import { privateSearchSurface } from './lib/site-seo';
import { NextResponse, type NextRequest } from 'next/server';
import { adminPageDecision } from '../backend/src/modules/auth/admin-policy';
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.delete('x-desla-private-admin');
  const decision = adminPageDecision(req.nextUrl.pathname, req.nextUrl.searchParams.get('screen'));
  if (decision === 'deny') return new NextResponse('Not found', { status: 404 });
  if (decision === 'private') {
    const target = req.nextUrl.clone(); target.pathname = '/'; target.searchParams.delete('screen');
    headers.set('x-desla-private-admin', '1');
    const response = NextResponse.rewrite(target, { request: { headers } });
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  const response = NextResponse.next({ request: { headers } });
  if (privateSearchSurface(req.nextUrl.pathname, req.nextUrl.searchParams.get('screen'))) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
