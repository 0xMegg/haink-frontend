import { NextResponse } from 'next/server';
import { buildStorageKey, uploadImage, createSignedImageUrl } from '@/server/image-storage';

export const runtime = 'nodejs';

const MAX_SIZE_MB = Number(process.env.PRODUCT_IMAGE_MAX_SIZE_MB ?? '8');
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: '업로드할 파일이 필요합니다.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `파일 크기가 너무 큽니다. 최대 ${MAX_SIZE_MB}MB 이하만 허용됩니다.` }, { status: 400 });
    }

    const productIdParam = formData.get('productId');
    const productId = typeof productIdParam === 'string' && productIdParam.trim() ? productIdParam.trim() : undefined;
    const storageKey = buildStorageKey(file.name, file.type, { productId });
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadImage(storageKey, buffer, file.type);

    let previewUrl: string | undefined;
    try {
      previewUrl = await createSignedImageUrl(storageKey);
    } catch {
      // signed URL 생성 실패해도 업로드 자체는 성공이므로 무시
    }

    return NextResponse.json({ storageKey, previewUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : '업로드 처리 중 오류가 발생했습니다.';
    console.error('[upload] failed to save file', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
