import Link from 'next/link';
import Image from 'next/image';
import type { Product, ExternalRef, ProductImage } from '@prisma/client';
import { resolveImageUrl } from '@/lib/image-url';
import { Badge } from '@/components/ui/badge';

interface Props {
  products: (Product & { externalRefs: ExternalRef[]; images: ProductImage[] })[];
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
        const thumbnail = [...product.images].sort((a, b) => a.sort_order - b.sort_order)[0];
        const thumbnailUrl = thumbnail ? resolveImageUrl(thumbnail.storage_key) : null;
        const ecountStatus = ecountRef
          ? ecountRef.last_synced_at
            ? `이카운트 연동 · ${formatDateTime(ecountRef.last_synced_at)}`
            : '이카운트 연동 · 동기화 이력 없음'
          : '이카운트 미연동';
        return (
          <div key={product.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">master_code: {product.master_code}</p>
              </div>
              <div className="flex items-center gap-2">
                {product.display_status ? <Badge>진열중</Badge> : <Badge variant="secondary">숨김</Badge>}
                <Link href={`/products/${product.id}`} className="text-sm text-primary underline">
                  수정
                </Link>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {thumbnailUrl ? (
                <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-md">
                  <Image src={thumbnailUrl} alt={product.name} fill className="object-cover" sizes="96px" />
                </div>
              ) : null}
              <p>가격: {product.price_krw.toLocaleString()}원 · 재고관리: {product.inventory_track ? 'Y' : 'N'}</p>
              <p>IMWEB 상품번호: {imwebRef?.external_product_id ?? '-'}</p>
              <p>{ecountStatus}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateTime(date: Date) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
