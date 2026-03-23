import { proxyBackendJson } from '@/lib/backend-api';

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  return proxyBackendJson(
    request,
    `/products/${params.id}/sync-ecount`,
    {
      method: 'POST',
    },
    { requireAdminAuth: true }
  );
}
