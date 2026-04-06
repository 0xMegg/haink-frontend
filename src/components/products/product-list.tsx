'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

import type { ProductListItemDto } from '@/lib/product-dtos';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductDeleteButton } from '@/components/products/product-delete-button';

interface Props {
  products: (ProductListItemDto & { thumbnailUrl?: string | null })[];
}

export function ProductList({ products }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  if (products.length === 0) {
    return <p className="text-sm text-muted-foreground">아직 등록된 상품이 없습니다.</p>;
  }

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < products.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = window.confirm(`선택한 ${count}개 상품을 삭제하시겠습니까?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/tools/bulk-delete-products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedIds) }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        window.alert(payload.error ?? '일괄 삭제에 실패했습니다.');
        return;
      }
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
          aria-label="전체 선택"
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.size > 0
            ? `${selectedIds.size}개 선택됨`
            : '전체 선택'}
        </span>
        {selectedIds.size > 0 && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedIds.size})`}
          </Button>
        )}
      </div>

      {products.map((product) => {
        const imwebRef = product.externalRefs.find((m) => m.system === 'IMWEB');
        const ecountRef = product.externalRefs.find((m) => m.system === 'ECOUNT');
        const thumbnailUrl = product.thumbnailUrl ?? null;
        const ecountStatus = ecountRef
          ? ecountRef.lastSyncedAt
            ? `이카운트 연동 · ${formatDateTime(ecountRef.lastSyncedAt)}`
            : '이카운트 연동 · 동기화 이력 없음'
          : '이카운트 미연동';
        return (
          <div key={product.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleOne(product.id)}
                  aria-label={`${product.name} 선택`}
                />
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-xs text-muted-foreground">master_code: {product.masterCode}</p>
                </div>
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
                    <div className="absolute left-1 top-1 flex flex-col gap-0.5">
                      {[...product.badges].sort((a, b) => a.priority - b.priority).slice(0, 2).map((badge) => (
                        <Badge
                          key={badge.badgeLabel}
                          className="max-w-[72px] truncate rounded-full text-[9px] px-1 py-0 leading-tight shadow-sm"
                          style={badge.badgeBgColor ? { backgroundColor: badge.badgeBgColor, color: badge.badgeTextColor ?? '#FFFFFF', borderColor: badge.badgeBgColor } : undefined}
                        >
                          {badge.badgeLabel}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : product.badges && product.badges.length > 0 ? (
                <div className="mb-2 flex gap-1">
                  {[...product.badges].sort((a, b) => a.priority - b.priority).slice(0, 2).map((badge) => (
                    <Badge
                      key={badge.badgeLabel}
                      className="rounded-full text-[9px] px-1 py-0 leading-tight shadow-sm"
                      style={badge.badgeBgColor ? { backgroundColor: badge.badgeBgColor, color: badge.badgeTextColor ?? '#FFFFFF', borderColor: badge.badgeBgColor } : undefined}
                    >
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
