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

function buildCsv(products: ProductListItemDto[]): string {
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
      p.masterCode,
      p.name,
      p.label,
      String(p.priceKrw),
      p.inventoryTrack ? 'Y' : 'N',
      p.saleStatus ?? '',
      p.displayStatus ? '진열' : '비진열',
      imwebRef?.externalProductId ?? '',
      ecountRef?.externalProductId ?? '',
      p.updatedAt,
    ].map(escapeCsvField);
  });

  return [headers.map(escapeCsvField).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

function formatDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export function ExportButton({ products }: ExportButtonProps) {
  const handleExport = () => {
    const csv = buildCsv(products);
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `상품목록_${formatDate()}.csv`;
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
