'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
  productFormSchema,
  type ProductFormValues,
  type ProductImageInput,
} from '@/lib/product-schema';
import { cn } from '@/lib/utils';
import Image from 'next/image';

import { resolveImageUrl } from '@/lib/image-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface ShippingProfileOption {
  id: string;
  name: string;
  description: string;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  defaultValues?: Partial<ProductFormValues>;
  shippingProfiles: ShippingProfileOption[];
}

const emptyDefaults: ProductFormValues = {
  productId: '',
  barcode: '',
  releaseDate: '',
  label: '',
  name: '',
  categoryIdsRaw: '',
  priceKRW: 0,
  inventoryTrack: false,
  stockQty: null,
  descriptionHtml: '',
  saleStatus: '',
  displayStatus: true,
  optionName: '',
  optionValues: '',
  issuedCategoryId: '',
  currentCategoryId: '',
  images: [],
  shippingProfileId: '',
};

export function ProductForm({ mode, productId, defaultValues, shippingProfiles }: ProductFormProps) {
  const router = useRouter();
  const defaultShippingProfileId = defaultValues?.shippingProfileId ?? shippingProfiles[0]?.id ?? '';
  const advancedDefaultOpen = Boolean(
    defaultValues?.optionName ||
      defaultValues?.optionValues
  );
  const isImwebIdLocked = mode === 'edit' && Boolean(defaultValues?.productId);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      ...emptyDefaults,
      ...defaultValues,
      productId: defaultValues?.productId ?? '',
      barcode: defaultValues?.barcode ?? '',
      releaseDate: defaultValues?.releaseDate ?? '',
      label: defaultValues?.label ?? '',
      optionValues: defaultValues?.optionValues ?? '',
      currentCategoryId: defaultValues?.currentCategoryId ?? '',
      issuedCategoryId: defaultValues?.issuedCategoryId ?? '',
      images: defaultValues?.images ?? [],
      shippingProfileId: defaultShippingProfileId,
    },
  });

  const [isSubmitting, setSubmitting] = React.useState(false);
  const [isUploadingImage, setUploadingImage] = React.useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = React.useState(advancedDefaultOpen);
  const inventoryTrack = form.watch('inventoryTrack');
  const images = form.watch('images') ?? [];
  const descriptionValue = form.watch('descriptionHtml') ?? '';

  React.useEffect(() => {
    if (!inventoryTrack) {
      form.setValue('stockQty', null, { shouldDirty: true });
    }
  }, [inventoryTrack, form]);
  React.useEffect(() => {
    if (!form.getValues('shippingProfileId') && defaultShippingProfileId) {
      form.setValue('shippingProfileId', defaultShippingProfileId, { shouldDirty: false });
    }
  }, [defaultShippingProfileId, form]);
  const handleDescriptionChange = React.useCallback(
    (value: string) => {
      form.setValue('descriptionHtml', value, { shouldDirty: true });
    },
    [form]
  );

  type ApiResponse = {
    error?: string;
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const endpoint = mode === 'create' ? '/api/products' : `/api/products/${productId}`;
      const res = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data: ApiResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '요청이 실패했습니다.');
      }
      toast.success(mode === 'create' ? '상품이 등록되었습니다.' : '상품이 수정되었습니다.');
      router.refresh();
      if (mode === 'create') {
        form.reset({
          ...emptyDefaults,
          shippingProfileId: shippingProfiles[0]?.id ?? '',
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploaded: ProductImageInput[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error('이미지 파일만 업로드할 수 있습니다.');
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        if (productId) {
          formData.append('productId', productId);
        }
        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          const message = typeof data?.error === 'string' ? data.error : '업로드에 실패했습니다.';
          throw new Error(message);
        }
        uploaded.push({
          storageKey: data.storageKey,
          previewUrl: data.previewUrl,
          type: 'THUMBNAIL',
        });
      }
      if (uploaded.length > 0) {
        const currentImages = form.getValues('images') ?? [];
        const nextImages = [...currentImages, ...uploaded].map((image, index) => ({
          ...image,
          sortOrder: index,
        }));
        form.setValue('images', nextImages, { shouldDirty: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = form.getValues('images') ?? [];
    const nextImages = currentImages.filter((_, idx) => idx !== index).map((image, idx) => ({
      ...image,
      sortOrder: idx,
    }));
    form.setValue('images', nextImages, { shouldDirty: true });
  };

  const imageErrorMessage = React.useMemo(() => {
    const error = form.formState.errors.images;
    if (!error) return undefined;
    if (Array.isArray(error)) {
      for (const entry of error) {
        if (entry && 'storageKey' in entry && entry.storageKey?.message) {
          return entry.storageKey.message;
        }
      }
    }
    if (typeof (error as { message?: string }).message === 'string') {
      return (error as { message?: string }).message;
    }
    return undefined;
  }, [form.formState.errors.images]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" {...form.register('shippingProfileId')} />

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">상품 정보</p>
          <h3 className="text-lg font-semibold">기본 정보</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="상품명" required>
            <Input placeholder="상품명" {...form.register('name')} />
            <FormError message={form.formState.errors.name?.message} />
          </Field>
          <Field label="브랜드 / 레이블" required>
            <Input placeholder="브랜드 또는 레이블명" {...form.register('label')} />
            <FormError message={form.formState.errors.label?.message} />
          </Field>
          <Field label="바코드" required>
            <Input placeholder="EAN/UPC" {...form.register('barcode')} />
            <FormError message={form.formState.errors.barcode?.message} />
          </Field>
          <Field label="발매일" required>
            <Input type="date" {...form.register('releaseDate')} />
            <FormError message={form.formState.errors.releaseDate?.message} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">가격 · 판매</p>
          <h3 className="text-lg font-semibold">가격 및 판매 설정</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="판매가 (KRW)" required>
            <Input type="number" min={0} step={1} {...form.register('priceKRW', { valueAsNumber: true })} />
            <FormError message={form.formState.errors.priceKRW?.message} />
          </Field>
          <Field label="카테고리 ID (쉼표 구분)" required>
            <Input placeholder="CATE9,CATE44" {...form.register('categoryIdsRaw')} />
            <FormError message={form.formState.errors.categoryIdsRaw?.message} />
          </Field>
          <Field label="판매 상태">
            <Input placeholder="판매중" {...form.register('saleStatus')} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Product Media</p>
          <h3 className="text-lg font-semibold">상품 이미지</h3>
        </div>
        <Field label="상품 이미지">
          <div className="space-y-3">
            <Input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploadingImage || isSubmitting} />
            {isUploadingImage ? <p className="text-xs text-muted-foreground">이미지를 업로드하는 중입니다...</p> : null}
            {images.length === 0 ? (
              <p className="text-xs text-muted-foreground">이미지를 업로드하면 자동으로 등록됩니다.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image, index) => {
                  const url = image.previewUrl || resolveImageUrl(image.storageKey);
                  return (
                    <div key={`${image.storageKey}-${index}`} className="space-y-2 rounded-lg border p-3 text-xs">
                      {url ? (
                        <div className="relative h-32 w-full overflow-hidden rounded-md">
                          <Image src={url} alt={`상품 이미지 ${index + 1}`} fill className="object-cover" sizes="200px" />
                        </div>
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-md bg-muted text-muted-foreground">미리보기 없음</div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex-1 truncate" title={image.storageKey}>
                          {image.storageKey}
                        </span>
                        <Button type="button" size="sm" variant="outline" onClick={() => handleRemoveImage(index)}>
                          삭제
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <FormError message={imageErrorMessage} />
          </div>
        </Field>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">상세 설명</p>
          <h3 className="text-lg font-semibold">상품 상세를 위지윅으로 입력</h3>
        </div>
        <Field label="상품 상세 설명">
          <RichTextEditor value={descriptionValue} onChange={handleDescriptionChange} placeholder="상품 상세를 입력하세요." />
          <FormError message={form.formState.errors.descriptionHtml?.message} />
        </Field>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">재고 · 진열</p>
          <h3 className="text-lg font-semibold">재고 · 진열</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ToggleField label="재고 관리" description="Y면 수량 입력 필요">
            <Switch
              checked={form.watch('inventoryTrack')}
              onCheckedChange={(value) => form.setValue('inventoryTrack', value, { shouldDirty: true })}
            />
          </ToggleField>
          <Field label="재고 수량">
            <Input type="number" min={0} step={1} disabled={!inventoryTrack} {...form.register('stockQty', { valueAsNumber: true })} />
          </Field>
          <ToggleField label="노출 상태">
            <Switch
              checked={form.watch('displayStatus')}
              onCheckedChange={(value) => form.setValue('displayStatus', value, { shouldDirty: true })}
            />
          </ToggleField>
        </div>
      </section>

      <section className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          className="h-auto p-0 text-left text-sm font-medium text-primary underline-offset-2 hover:bg-transparent hover:underline"
          onClick={() => setShowAdvancedFields((prev) => !prev)}
        >
          {showAdvancedFields ? '옵션 설정 숨기기' : '옵션 설정 보기'}
        </Button>
        {showAdvancedFields ? (
          <section className="space-y-4 rounded-lg border p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">옵션 확장</p>
              <h4 className="text-base font-semibold">필수 옵션 설정</h4>
              <p className="text-xs text-muted-foreground">필요한 경우에만 입력하세요. 쉼표로 값을 구분합니다.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="옵션 이름">
                <Input placeholder="예: 색상" {...form.register('optionName')} />
              </Field>
              <Field label="옵션 값 (쉼표 구분)">
                <Input placeholder="빨강,파랑,검정" {...form.register('optionValues')} />
              </Field>
            </div>
          </section>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">외부 연동</p>
          <h3 className="text-lg font-semibold">외부 시스템 연동</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="IMWEB 상품번호">
            <Input placeholder="예: 5757" disabled={isImwebIdLocked} {...form.register('productId')} />
            <FormError message={form.formState.errors.productId?.message} />
          </Field>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? '상품 등록' : '상품 수정'}
        </Button>
        {mode === 'edit' && (
          <Button type="button" variant="outline" onClick={() => form.reset(form.getValues())}>
            변경 취소
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children, required, className }: { label: string; children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function ToggleField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
