'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProductListItemDto } from '@/lib/product-dtos';

interface ExportButtonProps {
  products: ProductListItemDto[];
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportButton({ products }: ExportButtonProps) {
  const handleExport = () => {
    const headers = [
      '마스터코드',
      '상품명',
      '라벨',
      '가격(원)',
      '재고관리',
      '판매상태',
      '진열상태',
      '아임웹상품번호',
      '이카운트상품번호',
      '최종수정일',
    ];

    const rows = products.map((p) => {
      const imwebRef = p.externalRefs.find((r) => r.system === 'IMWEB');
      const ecountRef = p.externalRefs.find((r) => r.system === 'ECOUNT');
      return [
        escapeCsvField(p.masterCode),
        escapeCsvField(p.name),
        escapeCsvField(p.label),
        String(p.priceKrw),
        p.inventoryTrack ? 'Y' : 'N',
        escapeCsvField(p.saleStatus ?? ''),
        p.displayStatus ? '진열' : '미진열',
        escapeCsvField(imwebRef?.externalProductId ?? ''),
        escapeCsvField(ecountRef?.externalProductId ?? ''),
        escapeCsvField(p.updatedAt),
      ].join(',');
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `상품목록_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" disabled={products.length === 0} onClick={handleExport}>
      <Download className="mr-1.5 h-4 w-4" />
      내보내기
    </Button>
  );
}
