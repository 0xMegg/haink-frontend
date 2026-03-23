import { proxyBackendJson } from '@/lib/backend-api';

interface RouteContext {
  params: { category: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const payload = (await request.json()) as { nextSeq?: number };
    return proxyBackendJson(
      request,
      `/code-sequences/${encodeURIComponent(params.category)}`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      { requireAdminAuth: true }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return Response.json({ error: message }, { status: 400 });
  }
}
