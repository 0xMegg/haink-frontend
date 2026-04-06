import { proxyBackendJson } from '@/lib/backend-api';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return proxyBackendJson(
      request,
      '/products/bulk-delete',
      {
        method: 'POST',
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
