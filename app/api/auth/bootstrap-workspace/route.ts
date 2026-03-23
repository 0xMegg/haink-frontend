import { NextResponse } from 'next/server';

import { applySessionCookies } from '@/lib/auth-session';
import { proxyBackendJson } from '@/lib/backend-api';

export async function POST(request: Request) {
  const response = await proxyBackendJson(
    request,
    '/auth/bootstrap-workspace',
    {
      method: 'POST',
    }
  );

  if (!response.ok) {
    return response;
  }

  const payload = (await response.json()) as {
    data?: {
      workspace?: {
        id: string;
      };
    };
  };
  const nextResponse = NextResponse.json(payload, { status: response.status });
  applySessionCookies(nextResponse, {
    workspaceId: payload.data?.workspace?.id ?? null,
  });
  return nextResponse;
}
