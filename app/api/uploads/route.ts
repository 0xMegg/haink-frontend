import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { buildStorageKey, resolveAbsoluteImagePath } from '@/server/image-storage';

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

    const storageKey = buildStorageKey(file.name, file.type);
    const absolutePath = resolveAbsoluteImagePath(storageKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    return NextResponse.json({ storageKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : '업로드 처리 중 오류가 발생했습니다.';
    console.error('[upload] failed to save file', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
