import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [sequences, totalProducts, imwebMapCount, exchangeRates, ecountMapCount, pendingEcountProducts] =
      await Promise.all([
        prisma.codeSequenceByCategory.findMany({
          orderBy: { issued_category_id: 'asc' },
        }),
        prisma.product.count(),
        prisma.externalRef.count({
          where: { system: 'IMWEB' },
        }),
        prisma.exchangeRate.findMany({
          orderBy: { effective_from: 'desc' },
        }),
        prisma.externalRef.count({
          where: { system: 'ECOUNT' },
        }),
        prisma.product.findMany({
          where: {
            OR: [
              { externalRefs: { none: { system: 'ECOUNT' } } },
              {
                externalRefs: {
                  some: {
                    system: 'ECOUNT',
                    OR: [{ last_synced_at: null }, { last_sync_direction: { not: 'PUSH' } }],
                  },
                },
              },
            ],
          },
          orderBy: { created_at: 'desc' },
          take: 15,
          select: {
            id: true,
            name: true,
            master_code: true,
            created_at: true,
            externalRefs: {
              where: { system: 'ECOUNT' },
              select: {
                id: true,
                last_synced_at: true,
                last_sync_direction: true,
              },
            },
          },
        }),
      ]);

    const normalizedExchangeRates = exchangeRates.map((rate) => ({
      id: rate.id,
      base_currency: rate.base_currency,
      target_currency: rate.target_currency,
      rate: rate.rate.toString(),
      effective_from: rate.effective_from.toISOString(),
    }));

    const pendingEcountList = pendingEcountProducts.map((product) => {
      const ref = product.externalRefs[0];
      return {
        id: product.id,
        name: product.name,
        masterCode: product.master_code,
        createdAt: product.created_at.toISOString(),
        lastSyncedAt: ref?.last_synced_at ? ref.last_synced_at.toISOString() : null,
        lastSyncDirection: ref?.last_sync_direction ?? null,
      };
    });

    return NextResponse.json({
      data: {
        sequences,
        totals: {
          totalProducts,
          imwebMapCount,
          ecountMapCount,
        },
        exchangeRates: normalizedExchangeRates,
        pendingEcountProducts: pendingEcountList,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '제어 센터 데이터를 불러오지 못했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
