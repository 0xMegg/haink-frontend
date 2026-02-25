import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';
import { listProducts } from '@/lib/products';
import { productFormSchema, type ProductImageInput, SALES_CHANNEL_OPTIONS } from '@/lib/product-schema';
import { parseCategoryIds } from '@/lib/category';
import { CodeIssuer } from '@/lib/code-issuer';
import { syncProductToEcount } from '@/lib/ecount-sync';
import { EcountApiError } from '@/lib/ecount';

const codeIssuer = new CodeIssuer();

export async function GET() {
  const data = await listProducts(50);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = productFormSchema.parse(payload);
    const categories = parseCategoryIds(result.categoryIdsRaw);
    const issuedCategoryId = (result.issuedCategoryId?.trim() || categories[0]) ?? null;
    const currentCategoryId = (result.currentCategoryId?.trim() || categories[0]) ?? null;
    const description = result.descriptionHtml?.trim() ? result.descriptionHtml : null;
    const saleStatus = result.saleStatus?.trim() ? result.saleStatus : null;
    const optionName = result.optionName?.trim() ? result.optionName : null;
    const sotMode = result.sotMode ?? 'LEGACY_IMWEB';
    const sourceOfTruth = result.sourceOfTruth ?? 'IMWEB';
    const externalUrl = result.externalUrl?.trim() ? result.externalUrl.trim() : null;
    const rawSnapshot = parseRawSnapshot(result.rawSnapshot);
    const imageInputs = normalizeImages(result.images);
    const releaseDate = new Date(result.releaseDate);
    if (Number.isNaN(releaseDate.getTime())) {
      throw new Error('발매일 형식이 올바르지 않습니다.');
    }
    const visibleChannelSet = new Set(result.visibleChannels);

    const optionValues = (result.optionValues ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!issuedCategoryId) {
      throw new Error('카테고리 ID를 입력하세요.');
    }
    const imwebProductId = result.productId ?? null;

    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (imwebProductId) {
        const existing = await tx.externalRef.findUnique({
          where: {
            system_external_product_id: {
              system: 'IMWEB',
              external_product_id: imwebProductId,
            },
          },
        });
        if (existing) {
          throw new Error('이미 존재하는 IMWEB 상품입니다.');
        }
      }

      const { masterCode } = await codeIssuer.issue(tx, issuedCategoryId);

      const created = await tx.product.create({
        data: {
          master_code: masterCode,
          name: result.name,
          barcode: result.barcode,
          release_date: releaseDate,
          label: result.label,
          issued_category_id: issuedCategoryId,
          current_category_id: currentCategoryId ?? issuedCategoryId,
          category_ids_raw: categories,
          price_krw: result.priceKRW,
          inventory_track: result.inventoryTrack,
          stock_qty: result.inventoryTrack ? result.stockQty ?? null : null,
          sale_status: saleStatus,
          display_status: result.displayStatus,
          description_html: description,
          option_name: optionName,
          sot_mode: sotMode,
          shipping_profile_id: result.shippingProfileId?.trim() || null,
          images:
            imageInputs.length > 0
              ? {
                  createMany: {
                    data: imageInputs,
                  },
                }
              : undefined,
          externalRefs: imwebProductId
            ? {
                create: {
                  system: 'IMWEB',
                  external_product_id: imwebProductId,
                  external_url: externalUrl,
                  source_of_truth: sourceOfTruth,
                  raw_snapshot_json: rawSnapshot ?? undefined,
                },
              }
            : undefined,
          channelVisibility: {
            createMany: {
              data: SALES_CHANNEL_OPTIONS.map((channel) => ({
                channel,
                is_visible: visibleChannelSet.has(channel),
              })),
            },
          },
          optionValues:
            optionValues.length > 0 && optionName
              ? {
                  createMany: {
                    data: optionValues.map((value: (typeof optionValues)[number]) => ({
                      option_name: optionName!,
                      display_value: value,
                      canonical_value: value.toUpperCase(),
                    })),
                  },
                }
              : undefined,
        },
        include: {
          externalRefs: true,
          optionValues: true,
          images: true,
          channelVisibility: true,
        },
      });

      await syncProductToEcount(tx, created);

      return created;
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    const status =
      error instanceof EcountApiError ? Math.max(error.status ?? 502, 400) : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function parseRawSnapshot(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('rawSnapshot 필드는 올바른 JSON 문자열이어야 합니다.');
  }
}

function normalizeImages(images?: ProductImageInput[] | null) {
  if (!images || images.length === 0) {
    return [];
  }
  return images
    .filter((image) => Boolean(image.storageKey))
    .map((image, index) => ({
      type: image.type ?? 'THUMBNAIL',
      storage_key: image.storageKey,
      sort_order: image.sortOrder ?? index,
    }));
}
