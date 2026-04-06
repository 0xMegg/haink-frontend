import { cookies } from 'next/headers';

import { proxyBackendJson } from '@/lib/backend-api';
import { WORKSPACE_ID_COOKIE } from '@/lib/auth-session';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendJson(request, `/scheduled-jobs${url.search}`);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const workspaceId = cookies().get(WORKSPACE_ID_COOKIE)?.value?.trim();
    if (!workspaceId) {
      return Response.json({ error: 'workspace_id 쿠키가 없습니다.' }, { status: 400 });
    }
    payload.workspaceId = workspaceId;

    return proxyBackendJson(
      request,
      '/scheduled-jobs',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { requireAdminAuth: true }
    );
  } catch {
    return Response.json({ error: '요청 본문을 파싱할 수 없습니다.' }, { status: 400 });
  }
}
