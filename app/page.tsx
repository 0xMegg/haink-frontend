import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchInternalApi } from '@/lib/internal-api';
import type { ProductListItemDto } from '@/lib/product-dtos';
import { ProductList } from '@/components/products/product-list';
import { IntegrationToggleBar } from '@/components/products/integration-toggle-bar';
import { Button } from '@/components/ui/button';
import { getOnboardingStateCopy } from '@/lib/reviewer-readiness';
import { buildOnboardingRedirectPath } from '@/lib/onboarding-redirect';
import { LandingPage } from '@/components/landing/landing-page';
import { createSignedImageUrl } from '@/server/image-storage';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const session = await fetchInternalApi<{
    onboardingState: 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';
    workspace: {
      id: string;
      name: string;
    } | null;
  } | null>('/api/auth/session', {
    fallback: null,
  });

  if (!session) {
    return <LandingPage />;
  }
  if (session.onboardingState !== 'READY') {
    redirect(buildOnboardingRedirectPath('/'));
  }

  const imwebOnly = parseBool(searchParams?.imweb);
  const ecountOnly = parseBool(searchParams?.ecount);
  const query = buildQuery(imwebOnly, ecountOnly);
  const productList = await fetchInternalApi<{ items: ProductListItemDto[]; limit: number }>(
    `/api/products${query}`,
    {
      fallback: {
        items: [],
        limit: 20,
      },
    }
  );
  const products = await Promise.all(
    productList.items.map(async (item) => {
      const thumbnail = [...item.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
      let thumbnailUrl: string | null = null;
      if (thumbnail?.storageKey) {
        try {
          thumbnailUrl = await createSignedImageUrl(thumbnail.storageKey);
        } catch { /* S3 unavailable */ }
      }
      return { ...item, thumbnailUrl };
    })
  );
  const stateCopy = getOnboardingStateCopy('READY');
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-[linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reviewer Flow</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{stateCopy.label}</h2>
            <p className="mt-1 text-sm text-slate-700">{stateCopy.nextAction}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/onboarding">온보딩 상태 보기</Link>
          </Button>
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">최근 등록된 상품</h2>
          <p className="text-sm text-muted-foreground">{session.workspace?.name} 기준 최근 20개 상품을 표시합니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IntegrationToggleBar imwebOnly={imwebOnly} ecountOnly={ecountOnly} />
          <Button asChild>
            <Link href="/products/new">상품 등록</Link>
          </Button>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          불러온 상품이 없습니다. 온보딩으로 돌아가 import를 다시 실행하거나 신규 상품을 직접 등록하세요. reviewer demo는
          import 후 목록 진입, 상품 선택, 상세 편집 순서로 확인하면 됩니다.
        </div>
      ) : null}
      <ProductList products={products} />
    </div>
  );
}

function parseBool(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.some((entry) => entry === '1' || entry === 'true');
  }
  return value === '1' || value === 'true';
}

function buildQuery(imwebOnly: boolean, ecountOnly: boolean) {
  const params = new URLSearchParams();
  if (imwebOnly) {
    params.set('requireImweb', '1');
  }
  if (ecountOnly) {
    params.set('requireEcount', '1');
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
