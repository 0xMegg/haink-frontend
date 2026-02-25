import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { syncProductToEcount } from '@/lib/ecount-sync';
import { EcountApiError } from '@/lib/ecount';

class NotFoundError extends Error {}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const synced = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const product = await tx.product.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          master_code: true,
          name: true,
          label: true,
          barcode: true,
          price_krw: true,
          release_date: true,
          description_html: true,
          display_status: true,
          inventory_track: true,
          stock_qty: true,
          category_ids_raw: true,
        },
      });
      if (!product) {
        throw new NotFoundError('상품을 찾을 수 없습니다.');
      }

      await syncProductToEcount(tx, product);

      return product;
    });

    return NextResponse.json({
      data: {
        id: synced.id,
        masterCode: synced.master_code,
        name: synced.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    const status =
      error instanceof EcountApiError ? Math.max(error.status ?? 502, 400) : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
