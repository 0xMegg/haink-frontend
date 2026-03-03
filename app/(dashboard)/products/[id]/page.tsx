import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchInternalApi } from '@/lib/internal-api';
import { SALES_CHANNEL_OPTIONS } from '@/lib/product-schema';
import { toChannelOptions } from '@/lib/sales-channels';
import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { id: string };
}

type ExternalRefDto = {
  id: string;
  system: string;
  external_product_id: string;
  external_url: string | null;
  source_of_truth: string | null;
  raw_snapshot_json: unknown;
};

type ProductImageDto = {
  storage_key: string;
  type: string;
  sort_order: number;
};

type OptionValueDto = {
  option_name: string;
  display_value: string;
};

type ChannelVisibilityDto = {
  channel: string;
  is_visible: boolean;
};

type ProductDetailDto = {
  id: string;
  master_code: string;
  name: string;
  barcode: string;
  release_date: string;
  label: string;
  category_ids_raw: string[] | null;
  price_krw: number;
  inventory_track: boolean;
  stock_qty: number | null;
  sale_status: string | null;
  display_status: boolean;
  description_html: string | null;
  option_name: string | null;
  issued_category_id: string;
  current_category_id: string;
  sot_mode: 'LEGACY_IMWEB' | 'MASTER';
  shipping_profile_id: string | null;
  externalRefs: ExternalRefDto[];
  optionValues: OptionValueDto[];
  images: ProductImageDto[];
  channelVisibility: ChannelVisibilityDto[];
  shippingProfile: {
    id: string;
    name: string;
    base_country: string;
    method: string;
    bundle_allowed: boolean;
  } | null;
};

type ShippingProfileDto = {
  id: string;
  name: string;
  base_country: string;
  method: string;
  bundle_allowed: boolean;
};

export default async function EditProductPage({ params }: Props) {
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
  const categoryIds = Array.isArray(product.category_ids_raw) ? product.category_ids_raw.join(',') : '';
  const rawSnapshot = imweb?.raw_snapshot_json ? JSON.stringify(imweb.raw_snapshot_json, null, 2) : '';
  const profileOptions = shippingProfiles.map((profile) => ({
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
          releaseDate: new Date(product.release_date).toISOString().slice(0, 10),
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
          sourceOfTruth: (imweb?.source_of_truth as 'IMWEB' | 'MASTER' | undefined) ?? 'IMWEB',
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
