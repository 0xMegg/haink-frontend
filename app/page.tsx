import Link from 'next/link';
import type { Product, ExternalRef, ProductImage } from '@prisma/client';
import { fetchInternalApi } from '@/lib/internal-api';
import { ProductList } from '@/components/products/product-list';
import { IntegrationToggleBar } from '@/components/products/integration-toggle-bar';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const imwebOnly = parseBool(searchParams?.imweb);
  const ecountOnly = parseBool(searchParams?.ecount);
  const query = buildQuery(imwebOnly, ecountOnly);
  const products = await fetchInternalApi<
    (Product & { externalRefs: ExternalRef[]; images: ProductImage[] })[]
  >(`/api/products${query}`, {
    fallback: [],
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">최근 등록된 상품</h2>
          <p className="text-sm text-muted-foreground">가장 최근 20개 상품을 표시합니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <IntegrationToggleBar imwebOnly={imwebOnly} ecountOnly={ecountOnly} />
          <Button asChild>
            <Link href="/products/new">상품 등록</Link>
          </Button>
        </div>
      </div>
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
