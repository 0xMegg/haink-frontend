'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function WorkspaceBootstrapPanel() {
  const router = useRouter();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'failed'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const runBootstrap = React.useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch('/api/auth/bootstrap-workspace', {
        method: 'POST',
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'workspace 생성에 실패했습니다.');
      }
      router.refresh();
    } catch (bootstrapError) {
      setStatus('failed');
      setError(bootstrapError instanceof Error ? bootstrapError.message : 'workspace 생성에 실패했습니다.');
    }
  }, [router]);

  React.useEffect(() => {
    void runBootstrap();
  }, [runBootstrap]);

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Workspace Bootstrap</p>
      <h2 className="mt-2 text-xl font-semibold text-neutral-950">첫 workspace를 준비하는 중입니다</h2>
      <p className="mt-2 text-sm text-neutral-600">
        사용할 workspace가 아직 없어 첫 workspace를 자동으로 생성합니다.
      </p>
      <p className="mt-3 text-sm text-neutral-700">이 단계에서는 다른 선택지 없이 workspace 준비가 가장 우선입니다.</p>
      <p className="mt-4 text-sm text-neutral-700">
        {status === 'loading'
          ? 'workspace를 자동으로 준비하고 있습니다...'
          : error ?? 'workspace 생성이 필요합니다.'}
      </p>
      {status === 'failed' ? (
        <div className="mt-4 flex gap-3">
          <Button type="button" onClick={() => void runBootstrap()}>
            workspace 다시 준비
          </Button>
        </div>
      ) : null}
    </section>
  );
}
