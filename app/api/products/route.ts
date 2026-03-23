import { productFormSchema } from '@/lib/product-schema';
import { proxyBackendJson } from '@/lib/backend-api';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackendJson(request, `/products${url.search}`);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const validated = productFormSchema.parse(payload);
    return proxyBackendJson(
      request,
      '/products',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(validated),
      },
      { requireAdminAuth: true }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return Response.json({ error: message }, { status: 400 });
  }
}
