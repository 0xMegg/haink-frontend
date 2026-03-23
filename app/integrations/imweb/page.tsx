import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { mapOAuthFailureReason } from '@/lib/reviewer-readiness';

type PageProps = {
  searchParams?: {
    status?: string;
    reason?: string;
  };
};

export default function ImwebIntegrationPage({ searchParams }: PageProps) {
  const status = searchParams?.status?.toLowerCase() ?? 'pending';
  const reason = searchParams?.reason?.trim() || null;
  const failureMessage = mapOAuthFailureReason(reason);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-4 py-12">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Imweb Integration</p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-950">
          {status === 'success' ? '스토어 연결 완료' : status === 'fail' ? '스토어 연결 실패' : '스토어 연결 대기'}
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          {status === 'success'
            ? '스토어 연결은 완료되었습니다. onboarding으로 돌아가 import 단계를 진행하세요.'
            : status === 'fail'
              ? 'OAuth 처리에 실패했습니다. onboarding에서 다시 연결하거나 원인을 확인하세요.'
              : '스토어 연결 상태를 확인 중입니다.'}
        </p>
        {status === 'fail' ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{failureMessage}</p>
        ) : null}
        <div className="mt-5 flex gap-3">
          <Button asChild>
            <Link href="/onboarding">온보딩으로 이동</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">대시보드로 이동</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
