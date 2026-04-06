import { z } from 'zod';

const imageSchema = z.object({
  storageKey: z.string().min(1, '이미지 업로드에 실패했습니다. 다시 시도해주세요.'),
  previewUrl: z.string().optional(),
  type: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});
const imwebProductIdSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().min(1, 'IMWEB 상품번호를 입력하세요.').optional()
);

export const productFormSchema = z.object({
  productId: imwebProductIdSchema,
  barcode: z.string().min(1, '바코드를 입력하세요.'),
  releaseDate: z.string().min(1, '발매일을 입력하세요.'),
  label: z.string().min(1, '레이블을 입력하세요.'),
  name: z.string().min(1, '상품명을 입력하세요.'),
  categoryIdsRaw: z.string().min(1, '카테고리 ID를 입력하세요.'),
  priceKRW: z.coerce.number().int().nonnegative('가격은 0 이상이어야 합니다.'),
  inventoryTrack: z.boolean(),
  stockQty: z.coerce.number().int().nonnegative().nullable().optional(),
  descriptionHtml: z.string().optional(),
  saleStatus: z.string().optional(),
  displayStatus: z.boolean(),
  optionName: z.string().optional().nullable(),
  optionValues: z.string().optional(),
  issuedCategoryId: z.string().optional(),
  currentCategoryId: z.string().optional(),
  shippingProfileId: z.string().min(1, '배송 프로필을 선택하세요.'),
  images: z.array(imageSchema).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductImageInput = z.infer<typeof imageSchema>;
