import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { fetchInternalApi } from '@/lib/internal-api';
import type { ProductDetailDto } from '@/lib/product-dtos';
import { createSignedImageUrl } from '@/server/image-storage';
import { ProductForm } from '@/components/products/product-form';
import { ScheduledChangesPanel } from '@/components/products/scheduled-changes-panel';
import { Button } from '@/components/ui/button';
import { ProductDeleteButton } from '@/components/products/product-delete-button';
import { buildOnboardingRedirectPath } from '@/lib/onboarding-redirect';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { id: string };
}

type ShippingProfileDto = {
  id: string;
  name: string;
  base_country: string;
  method: string;
  bundle_allowed: boolean;
};

export default async function EditProductPage({ params }: Props) {
  const session = await fetchInternalApi<{
    onboardingState: 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';
  } | null>('/api/auth/session', {
    fallback: null,
  });

  if (!session) {
    redirect('/login');
  }
  if (session.onboardingState !== 'READY') {
    redirect(buildOnboardingRedirectPath(`/products/${params.id}`));
  }

  const [product, shippingProfiles] = await Promise.all([
    fetchInternalApi<ProductDetailDto | null>(`/api/products/${params.id}`, {
      fallback: null,
    }),
    fetchInternalApi<ShippingProfileDto[]>('/api/shipping-profiles', {
      fallback: [],
    }),
  ]);

  if (!product) {
    notFound();
  }

  const imweb = product.externalRefs.find((map) => map.system === 'IMWEB');
  const categoryIds = product.categoryIds.join(',');
  const profileOptions = shippingProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    description: `${profile.base_country} · ${profile.method}${profile.bundle_allowed ? ' · 묶음배송' : ''}`,
  }));

  if (profileOptions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        배송 프로필이 없어 상품을 편집할 수 없습니다. 제어 센터에서 프로필을 추가한 뒤 다시 시도하세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">관리 코드: {product.masterCode}</p>
          <h2 className="text-xl font-semibold">상품 수정</h2>
        </div>
        <div className="flex items-center gap-2">
          <ProductDeleteButton
            productId={product.id}
            productName={product.name}
            redirectTo="/"
          />
          <Button variant="outline" asChild>
            <Link href="/">목록으로</Link>
          </Button>
        </div>
      </div>
      <ProductForm
        mode="edit"
        productId={product.id}
        defaultValues={{
          productId: imweb?.externalProductId ?? '',
          barcode: product.barcode,
          releaseDate: new Date(product.releaseDate).toISOString().slice(0, 10),
          label: product.label,
          name: product.name,
          categoryIdsRaw: categoryIds,
          priceKRW: product.priceKrw,
          inventoryTrack: product.inventoryTrack,
          stockQty: product.stockQty ?? undefined,
          saleStatus: product.saleStatus ?? undefined,
          displayStatus: product.displayStatus,
          descriptionHtml: product.descriptionHtml ?? undefined,
          optionName: product.optionName ?? undefined,
          optionValues: product.optionValues
            .map((value: (typeof product.optionValues)[number]) => value.displayValue)
            .join(','),
          issuedCategoryId: product.issuedCategoryId,
          currentCategoryId: product.currentCategoryId,
          shippingProfileId: product.shippingProfile?.id ?? profileOptions[0]?.id ?? '',
          images: await Promise.all(
            product.images
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(async (image) => {
                let previewUrl: string | undefined;
                if (/^https?:\/\//i.test(image.storageKey)) {
                  previewUrl = image.storageKey;
                } else {
                  try {
                    previewUrl = await createSignedImageUrl(image.storageKey);
                  } catch { /* S3 unavailable */ }
                }
                return {
                  storageKey: image.storageKey,
                  previewUrl,
                  type: image.type,
                  sortOrder: image.sortOrder,
                };
              })
          ),
        }}
        shippingProfiles={profileOptions}
      />
      <ScheduledChangesPanel productId={product.id} />
    </div>
  );
}
