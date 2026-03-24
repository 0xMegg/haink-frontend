import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ProductImportPanel } from '@/components/onboarding/product-import-panel';
import { RedirectNoticeToast } from '@/components/onboarding/redirect-notice-toast';
import { WorkspaceBootstrapPanel } from '@/components/onboarding/workspace-bootstrap-panel';
import { Button } from '@/components/ui/button';
import { fetchInternalApi } from '@/lib/internal-api';
import {
  deriveReviewerOnboardingState,
  getOnboardingStateCopy,
  mapOAuthFailureReason,
  summarizeEnvironmentReadiness,
} from '@/lib/reviewer-readiness';

export const dynamic = 'force-dynamic';

type SessionDto = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    role: string | null;
  } | null;
  onboardingState: 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';
  counts: {
    storeConnectionCount: number;
    productCount: number;
  };
};

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const session = await fetchInternalApi<SessionDto | null>('/api/auth/session', {
    fallback: null,
  });

  if (!session) {
    redirect('/login');
  }
  if (session.onboardingState === 'READY') {
    redirect('/');
  }

  const storeState = readQuery(searchParams?.store);
  const storeReason = readQuery(searchParams?.reason);
  const workspaceState = readQuery(searchParams?.workspace);
  const reviewerState = deriveReviewerOnboardingState(session.onboardingState);
  const stateCopy = getOnboardingStateCopy(reviewerState);
  const envReadiness = summarizeEnvironmentReadiness();

  return (
    <div className="space-y-6">
      <RedirectNoticeToast nextAction={stateCopy.nextAction} />
      <section className="rounded-2xl border bg-[linear-gradient(135deg,_#f8fafc_0%,_#e0f2fe_100%)] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">First Value Journey</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">첫 사용자 onboarding</h1>
        <p className="mt-2 text-sm text-slate-700">
          {session.workspace
            ? `${session.workspace.name} 기준으로 store 연결과 product import를 마무리하면 바로 Product dashboard로 이동합니다.`
            : 'workspace를 자동 준비한 뒤 store 연결과 product import 단계로 이동합니다.'}
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl bg-white/80 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                {stateCopy.label}
              </span>
              <span className="text-xs text-slate-500">backend authority 기준 현재 상태</span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-950">{stateCopy.title}</p>
            <p className="mt-1 text-sm text-slate-700">{stateCopy.description}</p>
            <p className="mt-3 text-sm text-slate-600">다음 액션: {stateCopy.nextAction}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-950">현재 진행 상황</p>
            <p className="mt-2">Workspace: {session.workspace ? '준비됨' : '준비 중'}</p>
            <p>Imweb 연결: {session.counts.storeConnectionCount > 0 ? '완료' : '미완료'}</p>
            <p>Imported products: {session.counts.productCount.toLocaleString()}건</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Review Steps</p>
        <h2 className="mt-2 text-xl font-semibold text-neutral-950">Reviewer가 따라가야 하는 경로</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StepCard
            index="1"
            title="Workspace 준비"
            status={session.workspace ? '완료' : '진행 중'}
            description="로그인 직후 첫 workspace를 자동 생성합니다."
          />
          <StepCard
            index="2"
            title="Imweb 연결"
            status={session.counts.storeConnectionCount > 0 ? '완료' : '대기'}
            description="OAuth 연결이 완료되면 import 단계로 넘어갑니다."
          />
          <StepCard
            index="3"
            title="상품 import 후 검토"
            status={session.counts.productCount > 0 ? '완료' : '대기'}
            description="상품 목록 확인 후 상세 편집 화면으로 진입합니다."
          />
        </div>
      </section>

      {workspaceState === 'missing' ? (
        <StatusBanner tone="warning" message="workspace context가 없어 먼저 workspace bootstrap이 필요합니다." />
      ) : null}
      {storeState === 'connected' ? (
        <StatusBanner tone="success" message="Imweb store 연결이 완료되었습니다. 이제 product import를 실행하세요." />
      ) : null}
      {storeState === 'failed' ? (
        <StatusBanner
          tone="error"
          message={`Imweb OAuth 처리에 실패했습니다. ${mapOAuthFailureReason(storeReason)}`}
        />
      ) : null}
      {storeState === 'misconfigured' ? (
        <StatusBanner
          tone="error"
          message="Imweb OAuth 환경 변수가 누락되었습니다. IMWEB_CLIENT_ID와 IMWEB_REDIRECT_URI를 설정한 뒤 다시 시도하세요."
        />
      ) : null}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Environment Readiness</p>
        <h2 className="mt-2 text-xl font-semibold text-neutral-950">리뷰 전 설정 확인</h2>
        <p className="mt-2 text-sm text-neutral-600">
          reviewer flow에 직접 영향을 주는 frontend 환경 값과 operator 확인이 필요한 backend 환경 값입니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {envReadiness.checks.map((check) => (
            <span
              key={check.name}
              className={`rounded-full px-3 py-1 ${
                check.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {check.name}: {check.ready ? 'READY' : 'MISSING'}
            </span>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>Backend required env: AUTH_JWT_SECRET, IMWEB_CLIENT_SECRET, ECOUNT credential group</p>
          <p className="mt-1">문서: `haink-frontend/README.md`, `haink-backend/README.md`</p>
          {!envReadiness.ok ? (
            <p className="mt-2 text-amber-800">
              현재 frontend에서 확인된 누락 값: {envReadiness.missing.join(', ')}
            </p>
          ) : null}
        </div>
      </section>

      {session.onboardingState === 'NO_WORKSPACE' ? <WorkspaceBootstrapPanel /> : null}
      {session.onboardingState === 'NO_STORE' ? (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Store Connection</p>
          <h2 className="mt-2 text-xl font-semibold text-neutral-950">Imweb 스토어 연결</h2>
          <p className="mt-2 text-sm text-neutral-600">Imweb 계정을 연결하면 곧바로 상품 import 단계로 넘어갈 수 있습니다.</p>
          <p className="mt-3 text-sm text-neutral-700">현재 단계의 1차 액션은 Imweb 연결 1개뿐입니다.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/api/auth/imweb/start">Imweb 연결 시작</Link>
            </Button>
          </div>
        </section>
      ) : null}
      {session.onboardingState === 'NO_PRODUCT' ? <ProductImportPanel /> : null}
    </div>
  );
}

function readQuery(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function StatusBanner({ tone, message }: { tone: 'success' | 'warning' | 'error'; message: string }) {
  const className =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-800'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-rose-50 text-rose-700';

  return <div className={`rounded-xl px-4 py-3 text-sm ${className}`}>{message}</div>;
}

function StepCard({
  index,
  title,
  status,
  description,
}: {
  index: string;
  title: string;
  status: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step {index}</p>
      <p className="mt-2 font-medium text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <p className="mt-3 text-xs font-medium text-slate-700">상태: {status}</p>
    </div>
  );
}
