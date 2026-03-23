import { z } from 'zod';

import { proxyBackendJson } from '@/lib/backend-api';

const updateSchema = z.object({
  rate: z.number().positive().optional(),
  effectiveFrom: z.string().optional(),
});

interface RouteContext {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const raw = await request.json();
    const parsed = updateSchema.parse({
      ...raw,
      rate: typeof raw?.rate === 'string' ? Number(raw.rate) : raw?.rate,
    });
    return proxyBackendJson(
      request,
      `/exchange-rates/${params.id}`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(parsed),
      },
      { requireAdminAuth: true }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return proxyBackendJson(
    request,
    `/exchange-rates/${params.id}`,
    {
      method: 'DELETE',
    },
    { requireAdminAuth: true }
  );
}
