import { z } from 'zod';

import { proxyBackendJson } from '@/lib/backend-api';

const createSchema = z.object({
  baseCurrency: z.string().min(1),
  targetCurrency: z.string().min(1),
  rate: z.number().positive(),
  effectiveFrom: z.string().min(1),
});

export async function GET(request: Request) {
  return proxyBackendJson(request, '/exchange-rates');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse({
      ...body,
      rate: typeof body?.rate === 'string' ? Number(body.rate) : body?.rate,
    });
    return proxyBackendJson(
      request,
      '/exchange-rates',
      {
        method: 'POST',
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
