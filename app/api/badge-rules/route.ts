import { cookies } from 'next/headers';

import { proxyBackendJson } from '@/lib/backend-api';
import { WORKSPACE_ID_COOKIE } from '@/lib/auth-session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendJson(request, `/badge-rules${url.search}`);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workspaceId = cookies().get(WORKSPACE_ID_COOKIE)?.value?.trim();
    if (!workspaceId) {
      return Response.json({ error: 'workspace_id 쿠키가 없습니다.' }, { status: 400 });
    }
    body.workspaceId = workspaceId;

    return proxyBackendJson(
      request,
      '/badge-rules',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      },
      { requireAdminAuth: true }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return Response.json({ error: message }, { status: 400 });
  }
}
