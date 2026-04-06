import { proxyBackendJson } from '@/lib/backend-api';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  return proxyBackendJson(request, `/badge-rules/${params.id}`);
}
