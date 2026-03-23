'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { mapImportErrorMessage } from '@/lib/reviewer-readiness';

interface ImportReport {
  processed?: number;
  skippedExisting?: number;
  status?: string;
  errors?: Array<{ message?: string }>;
}

export function ProductImportPanel() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ImportReport | null>(null);

  const handleImport = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/onboarding/import', {
        method: 'POST',
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          report?: ImportReport;
        };
      };
      if (!response.ok) {
        throw new Error(payload.error ?? '상품 import에 실패했습니다.');
      }

      const report = payload.data?.report ?? null;
      setResult(report);

      if (report?.status === 'failed' || (report?.processed ?? 0) < 1) {
        throw new Error(report?.errors?.[0]?.message ?? 'import가 완료되었지만 usable product가 생성되지 않았습니다.');
      }

      router.push('/');
      router.refresh();
    } catch (importError) {
      const rawMessage = importError instanceof Error ? importError.message : null;
      setError(mapImportErrorMessage(rawMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Product Import</p>
      <h2 className="mt-2 text-xl font-semibold text-neutral-950">첫 상품 import 실행</h2>
      <p className="mt-2 text-sm text-neutral-600">
        연결된 workspace 기준 backend import flow를 실행하고, 성공 시 바로 Product dashboard로 이동합니다.
      </p>
      <p className="mt-3 text-sm text-neutral-700">현재 단계의 1차 액션은 상품 import 실행 1개뿐입니다.</p>

      {result ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {`가져온 상품 ${result.processed ?? 0}건, 건너뜀 ${result.skippedExisting ?? 0}건, 상태 ${result.status ?? 'unknown'}`}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p>{error}</p>
          <p className="mt-1">현재 데이터는 유지됩니다. 설정을 확인한 뒤 이 화면에서 다시 import를 실행할 수 있습니다.</p>
        </div>
      ) : null}

      <div className="mt-5 flex gap-3">
        <Button type="button" onClick={handleImport} disabled={isSubmitting}>
          {isSubmitting ? 'Import 실행 중...' : '상품 import 시작'}
        </Button>
        {error ? (
          <Button type="button" variant="outline" onClick={handleImport} disabled={isSubmitting}>
            Import 다시 시도
          </Button>
        ) : null}
      </div>
    </section>
  );
}
