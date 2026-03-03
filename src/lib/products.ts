import { prisma } from './prisma';
import type { Prisma, Product, ExternalRef, ProductImage } from '@prisma/client';

interface ListProductOptions {
  limit?: number;
  requireImweb?: boolean;
  requireEcount?: boolean;
}

export async function listProducts({
  limit = 20,
  requireImweb = false,
  requireEcount = false,
}: ListProductOptions = {}): Promise<(Product & { externalRefs: ExternalRef[]; images: ProductImage[] })[]> {
  try {
    const filters: Prisma.ProductWhereInput[] = [];
    if (requireImweb) {
      filters.push({ externalRefs: { some: { system: 'IMWEB' } } });
    }
    if (requireEcount) {
      filters.push({ externalRefs: { some: { system: 'ECOUNT' } } });
    }

    const where = filters.length > 0 ? { AND: filters } : undefined;

    return await prisma.product.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      where,
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
