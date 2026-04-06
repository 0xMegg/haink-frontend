import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { AUTH_TOKEN_COOKIE, WORKSPACE_ID_COOKIE } from '@/lib/auth-session';
import { getBackendBaseUrl } from '@/lib/backend-api';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const baseUrl = getBackendBaseUrl();
    const headers = new Headers();

    const authToken = cookies().get(AUTH_TOKEN_COOKIE)?.value?.trim();
    const incoming = request.headers.get('authorization');
    if (incoming) {
      headers.set('authorization', incoming);
    } else if (authToken) {
      headers.set('authorization', `Bearer ${authToken}`);
    }

    const workspaceId =
      request.headers.get('x-workspace-id')?.trim() ||
      cookies().get(WORKSPACE_ID_COOKIE)?.value?.trim();
    if (workspaceId) {
      headers.set('x-workspace-id', workspaceId);
    }

    const response = await fetch(
      `${baseUrl}/products/${params.id}/badge-image`,
      { headers, cache: 'no-store' }
    );

    if (!response.ok) {
      const text = await response.text();
      let message = '뱃지 이미지를 가져오지 못했습니다.';
      try {
        const json = JSON.parse(text) as { error?: string };
        if (json.error) message = json.error;
      } catch { /* not JSON */ }
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') ?? 'image/png';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: '백엔드 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
