import { NextResponse } from 'next/server';
import { createSignedImageUrl } from '@/server/image-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteParams {
  path?: string[];
}

function buildStorageKey(params: RouteParams): string | null {
  if (!params.path || params.path.length === 0) {
    return null;
  }
  const key = params.path.map((segment) => segment?.trim()).filter(Boolean).join('/');
  return key || null;
}

async function handleRequest(request: Request, params: RouteParams) {
  const storageKey = buildStorageKey(params);
  if (!storageKey) {
    return NextResponse.json({ error: '이미지 경로가 필요합니다.' }, { status: 400 });
  }

  try {
    const url = await createSignedImageUrl(storageKey, {
      expiresIn: Number(request.url && new URL(request.url).searchParams.get('ttl')) || undefined,
    });
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    console.error('[images] failed to create signed url', error);
    if (process.env.SKIP_AWS === '1') {
      return NextResponse.json({ error: '이미지 서비스를 사용할 수 없습니다.' }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : '이미지를 불러오는 중 오류가 발생했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request, context: { params: RouteParams }) {
  return handleRequest(request, context.params);
}

export async function HEAD(request: Request, context: { params: RouteParams }) {
  return handleRequest(request, context.params);
}
