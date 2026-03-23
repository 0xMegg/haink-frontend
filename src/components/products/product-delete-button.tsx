'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface Props {
  productId: string;
  productName: string;
}

export function ProductDeleteButton({ productId, productName }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(`"${productName}" 상품을 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch('/api/tools/delete-product', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'PRODUCT_ID',
        value: productId,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      window.alert(payload.error ?? '상품 삭제에 실패했습니다.');
      return;
    }

    router.refresh();
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleDelete}>
      삭제
    </Button>
  );
}
