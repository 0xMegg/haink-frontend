import 'server-only';

import type { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const AUTH_TOKEN_COOKIE = 'haink_auth_token';
export const WORKSPACE_ID_COOKIE = 'haink_workspace_id';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export function readAuthTokenCookie() {
  return cookies().get(AUTH_TOKEN_COOKIE)?.value?.trim() || null;
}

export function readWorkspaceIdCookie() {
  return cookies().get(WORKSPACE_ID_COOKIE)?.value?.trim() || null;
}

export function applySessionCookies(
  response: NextResponse,
  session: {
    token?: string | null;
    workspaceId?: string | null;
  }
) {
  if (session.token) {
    response.cookies.set({
      name: AUTH_TOKEN_COOKIE,
      value: session.token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }

  if (typeof session.workspaceId !== 'undefined') {
    if (session.workspaceId) {
      response.cookies.set({
        name: WORKSPACE_ID_COOKIE,
        value: session.workspaceId,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: COOKIE_MAX_AGE_SECONDS,
      });
    } else {
      response.cookies.delete(WORKSPACE_ID_COOKIE);
    }
  }
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(AUTH_TOKEN_COOKIE);
  response.cookies.delete(WORKSPACE_ID_COOKIE);
}
