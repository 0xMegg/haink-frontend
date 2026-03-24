import { NextResponse } from 'next/server';

import { applySessionCookies } from '@/lib/auth-session';
import { mapAuthFailureMessage } from '@/lib/auth-feedback';
import { getBackendBaseUrl, readBackendPayload } from '@/lib/backend-api';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${getBackendBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const payload = await readBackendPayload(response);
    if (!payload.ok) {
      return NextResponse.json(
        { error: mapAuthFailureMessage('login', response.status, payload.message) },
        { status: response.status }
      );
    }

    const data = payload.data as {
      token: string;
    };
    const session = await fetchBackendSession(data.token);
    const result = NextResponse.json({ data: payload.data }, { status: response.status });
    applySessionCookies(result, {
      token: data.token,
      workspaceId: session?.workspace?.id ?? null,
    });
    return result;
  } catch (error) {
    const raw = error instanceof Error ? error.message : '';
    const message = raw.includes('BACKEND_BASE_URL')
      ? '로그인 설정이 완료되지 않았습니다. 운영자가 BACKEND_BASE_URL을 확인해야 합니다.'
      : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function fetchBackendSession(token: string) {
  const response = await fetch(`${getBackendBaseUrl()}/auth/session`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  const payload = await readBackendPayload(response);
  if (!payload.ok) {
    return null;
  }
  return payload.data as {
    workspace?: {
      id: string;
    } | null;
  };
}
