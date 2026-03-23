import 'server-only';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { AUTH_TOKEN_COOKIE, WORKSPACE_ID_COOKIE } from '@/lib/auth-session';

interface ProxyOptions {
  requireAdminAuth?: boolean;
}

export function getBackendBaseUrl() {
  const baseUrl = process.env.BACKEND_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('BACKEND_BASE_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

function resolveAuthorizationHeader(request: Request, requireAdminAuth: boolean) {
  const incoming = request.headers.get('authorization');
  if (incoming) {
    return incoming;
  }
  const authToken = cookies().get(AUTH_TOKEN_COOKIE)?.value?.trim();
  if (authToken) {
    return `Bearer ${authToken}`;
  }
  if (!requireAdminAuth) {
    return null;
  }
  const adminToken = process.env.BACKEND_ADMIN_TOKEN?.trim();
  if (!adminToken) {
    throw new Error('BACKEND_ADMIN_TOKEN is not configured');
  }
  return `Bearer ${adminToken}`;
}

function resolveWorkspaceIdHeader(request: Request) {
  const incoming = request.headers.get('x-workspace-id');
  if (incoming?.trim()) {
    return incoming.trim();
  }
  const workspaceId = cookies().get(WORKSPACE_ID_COOKIE)?.value?.trim();
  return workspaceId || null;
}

export async function readBackendPayload(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return { ok: response.ok, message: text || response.statusText };
  }

  const payload = (await response.json()) as
    | { ok?: boolean; data?: unknown; error?: { message?: string } }
    | { data?: unknown; error?: string };

  if ('ok' in payload) {
    if (payload.ok) {
      return { ok: true, data: payload.data };
    }
    return {
      ok: false,
      message: payload.error?.message ?? response.statusText,
    };
  }

  if ('data' in payload) {
    return { ok: true, data: payload.data };
  }

  return {
    ok: false,
    message: typeof payload.error === 'string' ? payload.error : response.statusText,
  };
}

export async function proxyBackendJson(
  request: Request,
  path: string,
  init: RequestInit = {},
  options: ProxyOptions = {}
) {
  try {
    const headers = new Headers(init.headers);
    headers.set('accept', 'application/json');
    const authorization = resolveAuthorizationHeader(request, Boolean(options.requireAdminAuth));
    if (authorization) {
      headers.set('authorization', authorization);
    }
    const workspaceId = resolveWorkspaceIdHeader(request);
    if (workspaceId) {
      headers.set('x-workspace-id', workspaceId);
    }

    const response = await fetch(`${getBackendBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });

    const payload = await readBackendPayload(response);
    if (!payload.ok) {
      return NextResponse.json(
        { error: payload.message ?? 'Backend request failed.' },
        { status: response.status }
      );
    }

    return NextResponse.json({ data: payload.data }, { status: response.status });
  } catch (error) {
    const message = mapBackendProxyError(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mapBackendProxyError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLowerCase();

  if (normalized.includes('backend_base_url')) {
    return '백엔드 연결 주소가 설정되지 않았습니다. 운영자가 BACKEND_BASE_URL을 확인해야 합니다.';
  }
  if (normalized.includes('fetch failed') || normalized.includes('econnrefused')) {
    return '백엔드에 연결하지 못했습니다. 서버 상태와 환경 설정을 확인한 뒤 다시 시도해 주세요.';
  }
  return '백엔드 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}
