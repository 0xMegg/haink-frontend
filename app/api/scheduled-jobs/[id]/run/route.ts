import { proxyBackendJson } from '@/lib/backend-api';

interface RouteContext {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  return proxyBackendJson(
    request,
    `/scheduled-jobs/${params.id}/run`,
    {
      method: 'POST',
    },
    { requireAdminAuth: true }
  );
}
