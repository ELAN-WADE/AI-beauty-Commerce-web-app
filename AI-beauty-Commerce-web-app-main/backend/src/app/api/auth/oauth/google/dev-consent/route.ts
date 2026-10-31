import { NextResponse } from 'next/server';

export const GET = (req: Request) => {
  const url = new URL(req.url);
  const state = url.searchParams.get('state');
  const appUrl = (process.env.APP_URL || 'http://localhost:3005').replace(/\/+$/, '');
  const callbackUrl = new URL(`${appUrl}/api/auth/oauth/google/callback`);
  if (state) callbackUrl.searchParams.set('state', state);
  return NextResponse.redirect(callbackUrl.toString());
};
