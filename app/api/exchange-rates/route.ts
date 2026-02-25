import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  baseCurrency: z.string().min(1),
  targetCurrency: z.string().min(1),
  rate: z.number().positive(),
  effectiveFrom: z.string().min(1),
});

export async function GET() {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: { effective_from: 'desc' },
  });
  return NextResponse.json({ data: rates });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.parse({
      ...body,
      rate: typeof body?.rate === 'string' ? Number(body.rate) : body?.rate,
    });
    const effectiveFrom = new Date(parsed.effectiveFrom);
    if (Number.isNaN(effectiveFrom.getTime())) {
      throw new Error('effectiveFrom 값이 올바른 날짜가 아닙니다.');
    }
    const created = await prisma.exchangeRate.create({
      data: {
        base_currency: parsed.baseCurrency.toUpperCase(),
        target_currency: parsed.targetCurrency.toUpperCase(),
        rate: parsed.rate,
        effective_from: effectiveFrom,
      },
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
