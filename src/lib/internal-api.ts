import 'server-only';

import { headers } from 'next/headers';

interface FetchInternalApiOptions<T> extends RequestInit {
  fallback?: T;
  expectData?: boolean;
}

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build' ||
  process.env.SKIP_INTERNAL_API_FETCH === '1';

function resolveBaseUrl() {
  try {
    const hdrs = headers();
    const host = hdrs.get('host');
    if (host) {
      const protocol = hdrs.get('x-forwarded-proto') ?? 'http';
      return `${protocol}://${host}`;
    }
  } catch {
    // headers() 는 요청 컨텍스트 바깥(빌드 등)에서는 호출할 수 없어 예외가 발생할 수 있다.
  }

  const envUrl =
    process.env.INTERNAL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  return 'http://127.0.0.1:3000';
}

export async function fetchInternalApi<T = unknown>(
  path: string,
  options?: FetchInternalApiOptions<T>
): Promise<T> {
  const { fallback, expectData = true, cache, ...init } = options ?? {};

  if (isBuildTime && typeof fallback !== 'undefined') {
    return fallback;
  }

  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(headers().get('cookie') ? { cookie: headers().get('cookie') as string } : {}),
    },
    cache: cache ?? 'no-store',
  });

  if (!response.ok) {
    if (typeof fallback !== 'undefined') {
      return fallback;
    }
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  const payload = (await response.json()) as { data?: T };
  if (expectData) {
    return payload.data as T;
  }
  return payload as T;
}
