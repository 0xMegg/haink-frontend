import type { Metadata } from 'next';
import Link from 'next/link';

const QA_LINKS = [
  {
    label: 'Vercel QA 링크',
    href: 'https://haink-frontend.vercel.app/api/auth/imweb/callback?code=test',
    description: '배포 환경에서 callback?code=test 호출 시 실패 화면 노출 확인',
  },
  {
    label: '로컬 개발 링크',
    href: '/api/auth/imweb/callback?code=test',
    description: '로컬 dev 서버에서도 동일한 라우팅 동작 확인',
  },
];

const PLACEHOLDER_RETRY_URL = '/api/auth/imweb/start';
const SENSITIVE_KEYWORDS = [
  'access_token',
  'refresh_token',
  'client_secret',
  'authorization',
  'bearer',
  'token',
];

export const metadata: Metadata = {
  title: 'IMWEB 연동 상태',
};

type PageProps = {
  searchParams?: {
    status?: string;
    reason?: string;
  };
};

export default function ImwebIntegrationResultPage({ searchParams }: PageProps) {
  const status = normalizeStatus(searchParams?.status);
  const reason = searchParams?.reason ? decodeURIComponentSafe(searchParams.reason) : null;
  const safeReason = reason ? redactReason(reason) : null;
  const { title, description, hint } = buildViewModel(status);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-8 px-4 py-12">
      <section>
        <p className="text-sm uppercase tracking-wide text-neutral-500">IMWEB Integration</p>
        <h1 className="mt-2 text-3xl font-semibold text-neutral-900">{title}</h1>
        <p className="mt-4 text-base text-neutral-700">{description}</p>
        {safeReason ? (
          <p className="mt-3 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            Reason: <span className="font-mono text-neutral-900">{safeReason}</span>
          </p>
        ) : null}
        {hint ? <p className="mt-2 text-sm text-neutral-500">{hint}</p> : null}
      </section>

      <section className="rounded-lg border border-neutral-200 px-4 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">심사 · QA 테스트</h2>
        <p className="mt-2 text-sm text-neutral-600">
          `callback?code=test`를 호출했을 때 `/integrations/imweb?status=fail` 화면이 노출되면 콜백 경로가 정상임을 의미합니다.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          {QA_LINKS.map((link) => (
            <div key={link.label} className="flex-1 rounded-md border border-dashed border-neutral-300 px-3 py-3">
              <p className="text-sm font-medium text-neutral-800">{link.label}</p>
              <p className="mt-1 text-xs text-neutral-500">{link.description}</p>
              <Link
                href={link.href}
                className="mt-2 inline-flex items-center text-sm font-semibold text-blue-600 hover:underline"
              >
                바로 열기
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          대시보드로 돌아가기
        </Link>
        <Link
          href={PLACEHOLDER_RETRY_URL}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          연동 재시도 (준비 중)
        </Link>
        <Link
          href="mailto:support@haink.co.kr"
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          지원 문의
        </Link>
      </div>
    </main>
  );
}

function normalizeStatus(status?: string | null) {
  if (!status) return 'pending';
  return status.toLowerCase();
}

function decodeURIComponentSafe(value: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.error('[imweb:integration] Failed to decode reason', error);
    return value;
  }
}

function redactReason(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (SENSITIVE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return 'sensitive_redacted';
  }
  return trimmed.slice(0, 80);
}

function buildViewModel(status: string) {
  switch (status) {
    case 'success':
      return {
        title: '연동 성공',
        description: 'IMWEB OAuth 토큰 교환이 완료되었습니다. 이제 시스템에서 IMWEB 데이터를 사용할 수 있습니다.',
        hint: '확인 후 이 창을 닫아도 됩니다.',
      };
    case 'fail':
      return {
        title: '연동 실패',
        description: '백엔드 토큰 교환 단계에서 오류가 발생했습니다. Reason 값을 확인하고 필요 시 고객지원에 문의하세요.',
        hint: '연동 재시도 또는 지원팀 로그 확인이 필요할 수 있습니다.',
      };
    default:
      return {
        title: '상태 확인 필요',
        description:
          'IMWEB 인증이 완료되면 이 페이지에서 성공/실패 메시지가 표시됩니다. 심사 단계에서는 위 테스트 링크를 사용해 콜백 여부만 확인하세요.',
        hint: null,
      };
  }
}
