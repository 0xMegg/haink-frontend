import Link from 'next/link';
import Image from 'next/image';

import type { ProductListItemDto } from '@/lib/product-dtos';
import { resolveImageUrl } from '@/lib/image-url';
import { Badge } from '@/components/ui/badge';
import { ProductDeleteButton } from '@/components/products/product-delete-button';

interface Props {
  products: ProductListItemDto[];
}

export function ProductList({ products }: Props) {
  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 등록된 상품이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {products.map((product) => {
        const imwebRef = product.externalRefs.find((m) => m.system === 'IMWEB');
        const ecountRef = product.externalRefs.find((m) => m.system === 'ECOUNT');
        const thumbnail = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
        const thumbnailUrl = thumbnail ? resolveImageUrl(thumbnail.storageKey) : null;
        const ecountStatus = ecountRef
          ? ecountRef.lastSyncedAt
            ? `이카운트 연동 · ${formatDateTime(ecountRef.lastSyncedAt)}`
            : '이카운트 연동 · 동기화 이력 없음'
          : '이카운트 미연동';
        return (
          <div key={product.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">master_code: {product.masterCode}</p>
              </div>
              <div className="flex items-center gap-2">
                {product.displayStatus ? <Badge>진열중</Badge> : <Badge variant="secondary">숨김</Badge>}
                <Link href={`/products/${product.id}`} className="text-sm text-primary underline">
                  보기/수정
                </Link>
                <ProductDeleteButton productId={product.id} productName={product.name} />
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {thumbnailUrl ? (
                <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-md">
                  <Image src={thumbnailUrl} alt={product.name} fill className="object-cover" sizes="96px" />
                  {product.badges && product.badges.length > 0 && (
                    <div className="absolute left-1 top-1 flex flex-col gap-1">
                      {[...product.badges].sort((a, b) => a.priority - b.priority).slice(0, 2).map((badge) => (
                        <Badge key={badge.badgeLabel} className="max-w-[88px] truncate text-[10px] px-1.5 py-0">
                          {badge.badgeLabel}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : product.badges && product.badges.length > 0 ? (
                <div className="mb-2 flex gap-1">
                  {[...product.badges].sort((a, b) => a.priority - b.priority).slice(0, 2).map((badge) => (
                    <Badge key={badge.badgeLabel} className="text-[10px] px-1.5 py-0">
                      {badge.badgeLabel}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <p>가격: {product.priceKrw.toLocaleString()}원 · 재고관리: {product.inventoryTrack ? 'Y' : 'N'}</p>
              <p>IMWEB 상품번호: {imwebRef?.externalProductId ?? '-'}</p>
              <p>{ecountStatus}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}
