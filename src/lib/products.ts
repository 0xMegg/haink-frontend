import { prisma } from './prisma';
import type { Product, ExternalRef, ProductImage } from '@prisma/client';

export async function listProducts(
  limit = 20
): Promise<(Product & { externalRefs: ExternalRef[]; images: ProductImage[] })[]> {
  try {
    return await prisma.product.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        externalRefs: true,
        images: true,
      },
    });
  } catch (error) {
    console.warn('상품 목록을 가져오지 못했습니다.', error);
    return [];
  }
}

export async function getProduct(productId: string) {
  try {
    return await prisma.product.findUnique({
      where: { id: productId },
      include: {
        externalRefs: true,
        optionValues: true,
        images: true,
      },
    });
  } catch (error) {
    console.warn('상품 정보를 가져오지 못했습니다.', error);
    return null;
  }
}
