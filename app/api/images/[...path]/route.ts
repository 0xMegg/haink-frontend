import { NextResponse } from 'next/server';

import { createSignedImageUrl, guessImageContentType } from '@/server/image-storage';

export const runtime = 'nodejs';
const REMOTE_IMAGE_ORIGIN = process.env.IMAGE_PROXY_ORIGIN?.replace(/\/$/, '');

function encodeStorageKey(key: string) {
  return key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function tryRemoteFetch(storageKey: string) {
  if (!REMOTE_IMAGE_ORIGIN) return null;
  const upstreamUrl = `${REMOTE_IMAGE_ORIGIN}/${encodeStorageKey(storageKey)}`;
  try {
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok || !upstream.body) {
      console.error('[image-proxy] upstream error', upstream.status, upstream.statusText);
      return NextResponse.json({ error: '이미지를 불러오지 못했습니다.' }, { status: upstream.status || 502 });
    }
    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('content-type') ?? guessImageContentType(storageKey));
    headers.set('Cache-Control', upstream.headers.get('cache-control') ?? 'public, max-age=31536000, immutable');
    return new NextResponse(upstream.body, { headers });
  } catch (error) {
    console.error('[image-proxy] upstream fetch failed', error);
    return null;
  }
}

export async function GET(_request: Request, context: { params: { path?: string[] } }) {
  const segments = context.params.path ?? [];
  if (segments.length === 0) {
    return NextResponse.json({ error: '파일 경로가 필요합니다.' }, { status: 400 });
  }

  const storageKey = segments.join('/');

  const remote = await tryRemoteFetch(storageKey);
  if (remote) {
    return remote;
  }

  try {
    const signedUrl = await createSignedImageUrl(storageKey);
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid storage key') {
      return NextResponse.json({ error: '잘못된 파일 경로입니다.' }, { status: 400 });
    }
    console.error('[image] failed to sign url', error);
    return NextResponse.json({ error: '이미지를 불러오지 못했습니다.' }, { status: 500 });
  }
}
