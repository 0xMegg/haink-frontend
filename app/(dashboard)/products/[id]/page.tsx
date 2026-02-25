import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';
import { SALES_CHANNEL_OPTIONS } from '@/lib/product-schema';
import { toChannelOptions } from '@/lib/sales-channels';
import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { id: string };
}

export default async function EditProductPage({ params }: Props) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      externalRefs: true,
      optionValues: true,
      images: true,
      channelVisibility: true,
      shippingProfile: true,
    },
  });

  if (!product) {
    notFound();
  }

  const imweb = product.externalRefs.find((map) => map.system === 'IMWEB');
  const categoryIds = Array.isArray(product.category_ids_raw) ? product.category_ids_raw.join(',') : '';
  const rawSnapshot = imweb?.raw_snapshot_json ? JSON.stringify(imweb.raw_snapshot_json, null, 2) : '';
  const profileOptions = (await prisma.shippingProfile.findMany({ orderBy: { name: 'asc' } })).map((profile) => ({
    id: profile.id,
    name: profile.name,
    description: `${profile.base_country} · ${profile.method}${profile.bundle_allowed ? ' · 묶음배송' : ''}`,
  }));
  const channelOptions = toChannelOptions(SALES_CHANNEL_OPTIONS);
  const visibleChannels = product.channelVisibility.filter((entry) => entry.is_visible).map((entry) => entry.channel as typeof SALES_CHANNEL_OPTIONS[number]);

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
          <p className="text-xs text-muted-foreground">master_code: {product.master_code}</p>
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
          productId: imweb?.external_product_id ?? '',
          barcode: product.barcode,
          releaseDate: product.release_date.toISOString().slice(0, 10),
          label: product.label,
          name: product.name,
          categoryIdsRaw: categoryIds,
          priceKRW: product.price_krw,
          inventoryTrack: product.inventory_track,
          stockQty: product.stock_qty ?? undefined,
          saleStatus: product.sale_status ?? undefined,
          displayStatus: product.display_status,
          descriptionHtml: product.description_html ?? undefined,
          optionName: product.option_name ?? undefined,
          optionValues: product.optionValues
            .map((value: (typeof product.optionValues)[number]) => value.display_value)
            .join(','),
          issuedCategoryId: product.issued_category_id,
          currentCategoryId: product.current_category_id,
          sotMode: product.sot_mode,
          externalUrl: imweb?.external_url ?? '',
          sourceOfTruth: imweb?.source_of_truth ?? 'IMWEB',
          rawSnapshot,
          shippingProfileId: product.shipping_profile_id ?? profileOptions[0]?.id ?? '',
          visibleChannels: visibleChannels.length > 0 ? visibleChannels : channelOptions.map((channel) => channel.id),
          images: product.images
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((image) => ({
              storageKey: image.storage_key,
              type: image.type,
              sortOrder: image.sort_order,
            })),
        }}
        shippingProfiles={profileOptions}
        channelOptions={channelOptions}
      />
    </div>
  );
}
