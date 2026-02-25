import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  rate: z.number().positive().optional(),
  effectiveFrom: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const raw = await request.json();
    const parsed = updateSchema.parse({
      ...raw,
      rate: typeof raw?.rate === 'string' ? Number(raw.rate) : raw?.rate,
    });
    const data: Record<string, unknown> = {};
    if (typeof parsed.rate === 'number') {
      data.rate = parsed.rate;
    }
    if (parsed.effectiveFrom) {
      const effective = new Date(parsed.effectiveFrom);
      if (Number.isNaN(effective.getTime())) {
        throw new Error('effectiveFrom 값이 올바른 날짜 형식이 아닙니다.');
      }
      data.effective_from = effective;
    }
    if (Object.keys(data).length === 0) {
      throw new Error('업데이트할 필드를 입력하세요.');
    }
    const updated = await prisma.exchangeRate.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.exchangeRate.delete({ where: { id: params.id } });
    return NextResponse.json({ data: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
