import { z } from 'zod';

const SOT_MODE_VALUES = ['LEGACY_IMWEB', 'MASTER'] as const;
const SOURCE_OF_TRUTH_VALUES = ['IMWEB', 'MASTER'] as const;
export const SALES_CHANNELS = ['KODY_GLOBAL', 'KPOP_WHOLESALE', 'KPOP_B2B'] as const;
export type SalesChannel = (typeof SALES_CHANNELS)[number];

const sotModeSchema = z.enum(SOT_MODE_VALUES);
const sourceOfTruthSchema = z.enum(SOURCE_OF_TRUTH_VALUES);
const imageSchema = z.object({
  storageKey: z.string().min(1, '이미지 업로드에 실패했습니다. 다시 시도해주세요.'),
  type: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});
const salesChannelSchema = z.enum(SALES_CHANNELS);
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
  visibleChannels: z
    .array(salesChannelSchema)
    .min(1, '최소 1개 이상의 판매 채널을 선택하세요.')
    .refine((values) => new Set(values).size === values.length, '채널이 중복되었습니다.'),
  sotMode: sotModeSchema.optional(),
  externalUrl: z
    .string()
    .url('올바른 URL 형식이 아닙니다.')
    .or(z.literal(''))
    .optional(),
  sourceOfTruth: sourceOfTruthSchema.optional(),
  rawSnapshot: z.string().optional(),
  images: z.array(imageSchema).optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export const SOT_MODE_OPTIONS = SOT_MODE_VALUES;
export const SOURCE_OF_TRUTH_OPTIONS = SOURCE_OF_TRUTH_VALUES;
export const SALES_CHANNEL_OPTIONS = SALES_CHANNELS;
export type ProductImageInput = z.infer<typeof imageSchema>;
