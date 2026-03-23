export interface ProductListItemDto {
  id: string;
  masterCode: string;
  name: string;
  label: string;
  priceKrw: number;
  inventoryTrack: boolean;
  saleStatus: string | null;
  displayStatus: boolean;
  externalRefs: Array<{
    id: string;
    system: string;
    externalProductId: string;
    lastSyncDirection: string | null;
    lastSyncedAt: string | null;
  }>;
  images: Array<{
    id: number;
    type: string;
    storageKey: string;
    sortOrder: number;
  }>;
  updatedAt: string;
}

export interface ProductDetailDto {
  id: string;
  masterCode: string;
  name: string;
  barcode: string;
  releaseDate: string;
  label: string;
  categoryIds: string[];
  priceKrw: number;
  inventoryTrack: boolean;
  stockQty: number | null;
  saleStatus: string | null;
  displayStatus: boolean;
  descriptionHtml: string | null;
  optionName: string | null;
  issuedCategoryId: string;
  currentCategoryId: string;
  sotMode: 'LEGACY_IMWEB' | 'MASTER';
  shippingProfile: {
    id: string;
    name: string;
  } | null;
  externalRefs: Array<{
    id: string;
    system: string;
    externalProductId: string;
    externalUrl: string | null;
    sourceOfTruth: string | null;
    lastSyncDirection: string | null;
    lastSyncedAt: string | null;
    rawSnapshot: unknown;
  }>;
  optionValues: Array<{
    id: number;
    optionName: string;
    displayValue: string;
    canonicalValue: string;
  }>;
  images: Array<{
    id: number;
    type: string;
    storageKey: string;
    sortOrder: number;
  }>;
  channelVisibility: Array<{
    channel: string;
    isVisible: boolean;
  }>;
}
