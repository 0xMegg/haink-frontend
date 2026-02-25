import { prisma } from '@/lib/prisma';
import { ProductDeletionPanel } from '@/components/control-center/product-deletion-panel';
import { MasterCodePanel } from '@/components/control-center/master-code-panel';
import { ExchangeRatePanel } from '@/components/control-center/exchange-rate-panel';
import { EcountSyncPanel } from '@/components/control-center/ecount-sync-panel';

export const dynamic = 'force-dynamic';

export default async function ControlCenterPage() {
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
                  OR: [
                    { last_synced_at: null },
                    { last_sync_direction: { not: 'PUSH' } },
                  ],
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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Control</p>
          <h2 className="text-2xl font-semibold">제어 센터</h2>
          <p className="text-sm text-muted-foreground">상품 삭제 및 마스터코드 시퀀스를 한 곳에서 관리합니다.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProductDeletionPanel />
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4 space-y-1">
            <h3 className="text-lg font-semibold">상태 요약</h3>
            <p className="text-sm text-muted-foreground">현재 데이터 규모를 빠르게 확인하세요.</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">등록된 상품</dt>
              <dd className="text-2xl font-semibold">{totalProducts.toLocaleString()}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">IMWEB 매핑</dt>
              <dd className="text-2xl font-semibold">{imwebMapCount.toLocaleString()}</dd>
            </div>
            <div className="rounded-md border p-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">ECOUNT 연동</dt>
              <dd className="text-2xl font-semibold">{ecountMapCount.toLocaleString()}</dd>
            </div>
            <div className="rounded-md border p-3 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">마스터코드 카테고리</dt>
              <dd className="text-2xl font-semibold">{sequences.length.toLocaleString()}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MasterCodePanel initialSequences={sequences} />
        <ExchangeRatePanel initialRates={normalizedExchangeRates} />
      </div>

      <EcountSyncPanel
        totalProducts={totalProducts}
        syncedCount={ecountMapCount}
        initialItems={pendingEcountList}
      />
    </div>
  );
}
