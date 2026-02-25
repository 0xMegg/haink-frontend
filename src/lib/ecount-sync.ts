import type { Prisma, Product } from '@prisma/client';
import { ExternalSystem, SourceOfTruth, SyncDirection } from '@prisma/client';

import {
  buildEcountBulkDatas,
  createEcountClient,
  type MasterProductSnapshot,
  EcountApiError,
} from './ecount';

type ProductForSync = Pick<
  Product,
  | 'id'
  | 'master_code'
  | 'name'
  | 'label'
  | 'barcode'
  | 'price_krw'
  | 'release_date'
  | 'description_html'
  | 'display_status'
  | 'inventory_track'
  | 'stock_qty'
  | 'category_ids_raw'
>;

export async function syncProductToEcount(
  tx: Prisma.TransactionClient,
  product: ProductForSync
): Promise<{ skipped: boolean }> {
  const client = createEcountClient();
  if (!client) {
    return { skipped: true };
  }

  if (!product.master_code) {
    throw new Error('master_code 가 없어 이카운트 연동을 건너뜁니다.');
  }

  const snapshot: MasterProductSnapshot = {
    masterCode: product.master_code,
    name: product.name,
    label: product.label,
    barcode: product.barcode,
    priceKrw: product.price_krw,
    releaseDate: product.release_date,
    descriptionHtml: product.description_html,
    displayStatus: product.display_status,
    inventoryTrack: product.inventory_track,
    stockQty: product.inventory_track ? product.stock_qty ?? 0 : undefined,
    unit: 'EA',
    categoryIds: jsonToStringArray(product.category_ids_raw),
  };

  const payload = buildEcountBulkDatas(snapshot);

  try {
    const result = await client.saveBasicProduct(payload);
    await upsertEcountRef(tx, product, payload, result.rawResponse);
    return { skipped: false };
  } catch (error) {
    if (error instanceof EcountApiError) {
      throw error;
    }
    throw new Error(`이카운트 연동 중 오류: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function upsertEcountRef(
  tx: Prisma.TransactionClient,
  product: ProductForSync,
  payload: Record<string, string>,
  rawResponse: unknown
) {
  const existing = await tx.externalRef.findFirst({
    where: {
      product_id: product.id,
      system: ExternalSystem.ECOUNT,
    },
  });

  const externalId = payload.PROD_CD;

  const data = {
    product_id: product.id,
    system: ExternalSystem.ECOUNT,
    external_product_id: externalId,
    last_sync_direction: SyncDirection.PUSH,
    last_synced_at: new Date(),
    source_of_truth: SourceOfTruth.MASTER,
    raw_snapshot_json: {
      request: payload,
      response: toJsonValue(rawResponse),
    } satisfies Prisma.JsonObject,
  };

  if (existing) {
    await tx.externalRef.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await tx.externalRef.create({
      data,
    });
  }
}

function toJsonValue(value: unknown): Prisma.JsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.JsonValue;
  } catch {
    return null;
  }
}

function jsonToStringArray(value: Prisma.JsonValue | undefined): string[] {
  if (!value || !Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry;
      }
      if (entry != null) {
        return String(entry);
      }
      return '';
    })
    .filter((entry) => entry.length > 0);
}
