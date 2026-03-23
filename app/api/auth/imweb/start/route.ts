import { NextResponse } from 'next/server';

import { readAuthTokenCookie, readWorkspaceIdCookie } from '@/lib/auth-session';

const DEFAULT_IMWEB_AUTHORIZE_URL = 'https://api.imweb.me/oauth2/authorize';

export async function GET(request: Request) {
  const authToken = readAuthTokenCookie();
  const workspaceId = readWorkspaceIdCookie();

  if (!authToken) {
    return NextResponse.redirect(new URL('/login?reason=auth_required', request.url));
  }
  if (!workspaceId) {
    return NextResponse.redirect(new URL('/onboarding?workspace=missing', request.url));
  }

  const clientId = process.env.IMWEB_CLIENT_ID?.trim();
  const redirectUri = process.env.IMWEB_REDIRECT_URI?.trim();
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL('/onboarding?store=misconfigured', request.url));
  }

  const authorizeUrl = new URL(process.env.IMWEB_AUTHORIZE_URL?.trim() || DEFAULT_IMWEB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('state', workspaceId);

  return NextResponse.redirect(authorizeUrl);
}
