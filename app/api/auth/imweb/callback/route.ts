import { NextResponse } from 'next/server';

import { readAuthTokenCookie, readWorkspaceIdCookie } from '@/lib/auth-session';
import { getBackendBaseUrl } from '@/lib/backend-api';

const CALLBACK_SUCCESS_PATH = '/onboarding?store=connected';
const CALLBACK_FAIL_PATH = '/onboarding?store=failed';
const BACKEND_EXCHANGE_PATH = '/auth/imweb/exchange';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const authToken = readAuthTokenCookie();
  const workspaceId = readWorkspaceIdCookie();

  if (!code) {
    return NextResponse.redirect(buildFailUrl('missing_code', request.url));
  }
  if (!authToken) {
    return NextResponse.redirect(buildFailUrl('authentication_required', request.url));
  }
  if (!workspaceId) {
    return NextResponse.redirect(buildFailUrl('missing_workspace_context', request.url));
  }

  let backendUrl: string;
  try {
    backendUrl = buildBackendUrl(getBackendBaseUrl());
  } catch (error) {
    console.error('[imweb:callback] BACKEND_BASE_URL is not configured', error);
    return NextResponse.redirect(buildFailUrl('missing_backend_base_url', request.url));
  }

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${authToken}`,
        'x-workspace-id': workspaceId,
      },
      cache: 'no-store',
      body: JSON.stringify({ code }),
    });

    if (backendResponse.ok) {
      return NextResponse.redirect(new URL(CALLBACK_SUCCESS_PATH, request.url));
    }

    const failReason = await buildReasonFromResponse(backendResponse);
    return NextResponse.redirect(buildFailUrl(failReason, request.url));
  } catch (error) {
    console.error('[imweb:callback] Failed to call backend', error);
    return NextResponse.redirect(buildFailUrl('network_error', request.url));
  }
}

function buildBackendUrl(baseUrl: string) {
  const normalizedBase = baseUrl.replace(/\/$/, '');
  return `${normalizedBase}${BACKEND_EXCHANGE_PATH}`;
}

async function buildReasonFromResponse(response: Response) {
  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      const message = extractMessage(data);
      if (message) {
        return normalizeReasonCode(message, response.status);
      }
    } else {
      const text = (await response.text())?.trim();
      if (text) {
        return normalizeReasonCode(text, response.status);
      }
    }
  } catch (error) {
    console.error('[imweb:callback] Failed to parse backend error response', error);
    return 'backend_invalid_response';
  }
  const statusCode = response.status || 520;
  return `backend_${statusCode}`;
}

function extractMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const candidate =
    // @ts-expect-error runtime check only
    (typeof payload.error === 'string' && payload.error) ||
    // @ts-expect-error runtime check only
    (typeof payload.message === 'string' && payload.message);
  return candidate ?? null;
}

function normalizeReasonCode(raw: string, statusCode: number) {
  const lower = raw.trim().toLowerCase();
  if (!lower) {
    return `backend_${statusCode || 520}`;
  }
  if (
    lower === 'missing_code' ||
    lower === 'token_exchange_failed' ||
    lower === 'invalid_imweb_response' ||
    lower === 'server_error'
  ) {
    return lower;
  }
  if (/^imweb_\d+$/.test(lower)) {
    return lower;
  }
  return `backend_${statusCode || 520}`;
}

function buildFailUrl(reason: string, requestUrl: string) {
  const url = new URL(CALLBACK_FAIL_PATH, requestUrl);
  url.searchParams.set('reason', reason);
  return url;
}
