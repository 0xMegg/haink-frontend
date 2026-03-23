import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { fetchInternalApi } from '@/lib/internal-api';
import type { ProductDetailDto } from '@/lib/product-dtos';
import { SALES_CHANNEL_OPTIONS } from '@/lib/product-schema';
import { toChannelOptions } from '@/lib/sales-channels';
import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';

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
    redirect('/onboarding');
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
  const rawSnapshot = imweb?.rawSnapshot ? JSON.stringify(imweb.rawSnapshot, null, 2) : '';
  const profileOptions = shippingProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    description: `${profile.base_country} · ${profile.method}${profile.bundle_allowed ? ' · 묶음배송' : ''}`,
  }));
  const channelOptions = toChannelOptions(SALES_CHANNEL_OPTIONS);
  const visibleChannels = product.channelVisibility
    .filter((entry) => entry.isVisible)
    .map((entry) => entry.channel as (typeof SALES_CHANNEL_OPTIONS)[number]);

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
          <p className="text-xs text-muted-foreground">master_code: {product.masterCode}</p>
          <h2 className="text-xl font-semibold">상품 수정</h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">목록으로</Link>
        </Button>
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
          sotMode: product.sotMode,
          externalUrl: imweb?.externalUrl ?? '',
          sourceOfTruth: (imweb?.sourceOfTruth as 'IMWEB' | 'MASTER' | undefined) ?? 'IMWEB',
          rawSnapshot,
          shippingProfileId: product.shippingProfile?.id ?? profileOptions[0]?.id ?? '',
          visibleChannels: visibleChannels.length > 0 ? visibleChannels : channelOptions.map((channel) => channel.id),
          images: product.images
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((image) => ({
              storageKey: image.storageKey,
              type: image.type,
              sortOrder: image.sortOrder,
            })),
        }}
        shippingProfiles={profileOptions}
        channelOptions={channelOptions}
      />
    </div>
  );
}
