import { NextResponse } from 'next/server';

const CALLBACK_SUCCESS_PATH = '/integrations/imweb?status=success';
const CALLBACK_FAIL_PATH = '/integrations/imweb?status=fail';
const BACKEND_EXCHANGE_PATH = '/auth/imweb/exchange';
const SENSITIVE_KEYWORDS = [
  'access_token',
  'refresh_token',
  'client_secret',
  'authorization',
  'bearer',
  'token',
];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(buildFailUrl('missing_code', request.url));
  }

  const backendBaseUrl = process.env.BACKEND_BASE_URL?.trim();
  if (!backendBaseUrl) {
    console.error('[imweb:callback] BACKEND_BASE_URL is not configured');
    return NextResponse.redirect(buildFailUrl('missing_backend_base_url', request.url));
  }

  const backendUrl = buildBackendUrl(backendBaseUrl);
  const callbackOrigin = `${requestUrl.origin}${requestUrl.pathname}`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({ code, redirectUri: callbackOrigin }),
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
        return sanitizeReason(message);
      }
    } else {
      const text = (await response.text())?.trim();
      if (text) {
        return sanitizeReason(text);
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

function sanitizeReason(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return 'backend_invalid_response';
  if (containsSensitiveKeyword(trimmed)) {
    return 'sensitive_redacted';
  }
  return trimmed.slice(0, 80);
}

function containsSensitiveKeyword(value: string) {
  const lower = value.toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function buildFailUrl(reason: string, requestUrl: string) {
  const url = new URL(CALLBACK_FAIL_PATH, requestUrl);
  url.searchParams.set('reason', reason);
  return url;
}
