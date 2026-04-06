import { redirect } from 'next/navigation';

import { fetchInternalApi } from '@/lib/internal-api';
import { MasterCodePanel } from '@/components/control-center/master-code-panel';
import { buildOnboardingRedirectPath } from '@/lib/onboarding-redirect';

export const dynamic = 'force-dynamic';

type SequenceRow = {
  issued_category_id: string;
  next_seq: number;
};

type ControlCenterSummary = {
  sequences: SequenceRow[];
  totals: {
    totalProducts: number;
    imwebMapCount: number;
  };
};

export default async function ControlCenterPage() {
  const session = await fetchInternalApi<{
    onboardingState: 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';
  } | null>('/api/auth/session', {
    fallback: null,
  });

  if (!session) {
    redirect('/login');
  }
  if (session.onboardingState !== 'READY') {
    redirect(buildOnboardingRedirectPath('/control-center'));
  }

  const summary = await fetchInternalApi<ControlCenterSummary>('/api/control-center/summary', {
    fallback: {
      sequences: [],
      totals: {
        totalProducts: 0,
        imwebMapCount: 0,
      },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Control</p>
          <h2 className="text-2xl font-semibold">제어 센터</h2>
          <p className="text-sm text-muted-foreground">마스터코드 시퀀스와 데이터 현황을 한 곳에서 관리합니다.</p>
        </div>
      </div>

      <section className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="mb-4 space-y-1">
          <h3 className="text-lg font-semibold">상태 요약</h3>
          <p className="text-sm text-muted-foreground">현재 데이터 규모를 빠르게 확인하세요.</p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">등록된 상품</dt>
            <dd className="text-2xl font-semibold">{summary.totals.totalProducts.toLocaleString()}</dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">동기화 완료</dt>
            <dd className="text-2xl font-semibold">{summary.totals.imwebMapCount.toLocaleString()}</dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">마스터코드 카테고리</dt>
            <dd className="text-2xl font-semibold">{summary.sequences.length.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <MasterCodePanel initialSequences={summary.sequences} />
    </div>
  );
}
