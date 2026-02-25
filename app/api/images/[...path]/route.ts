import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';

import { guessImageContentType, resolveAbsoluteImagePath } from '@/server/image-storage';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: { path?: string[] } }) {
  const segments = context.params.path ?? [];
  if (segments.length === 0) {
    return NextResponse.json({ error: '파일 경로가 필요합니다.' }, { status: 400 });
  }

  const storageKey = segments.join('/');

  let absolutePath: string;
  try {
    absolutePath = resolveAbsoluteImagePath(storageKey);
  } catch {
    return NextResponse.json({ error: '잘못된 파일 경로입니다.' }, { status: 400 });
  }

  try {
    const file = await fs.readFile(absolutePath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': guessImageContentType(absolutePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: '이미지를 찾을 수 없습니다.' }, { status: 404 });
    }
    console.error('[image] failed to load file', error);
    return NextResponse.json({ error: '이미지를 불러오지 못했습니다.' }, { status: 500 });
  }
}
