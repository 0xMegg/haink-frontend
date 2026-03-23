import { proxyBackendJson } from '@/lib/backend-api';

export async function GET(request: Request) {
  return proxyBackendJson(request, '/control-center/summary');
}
