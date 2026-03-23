import { productFormSchema } from '@/lib/product-schema';
import { proxyBackendJson } from '@/lib/backend-api';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  return proxyBackendJson(request, `/products/${params.id}`);
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const payload = await request.json();
    const validated = productFormSchema.parse(payload);
    return proxyBackendJson(
      request,
      `/products/${params.id}`,
      {
        method: 'PUT',
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
