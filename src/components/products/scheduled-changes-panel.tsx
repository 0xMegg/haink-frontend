'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScheduledJob {
  id: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  scheduledAt: string;
  payloadJson: Record<string, unknown>;
  targetProductIds: string[];
  createdAt: string;
}

interface ScheduledChangesPanelProps {
  productId: string;
}

const FIELD_OPTIONS = [
  { value: 'priceKrw', label: '가격 (KRW)' },
  { value: 'saleStatus', label: '판매 상태' },
  { value: 'displayStatus', label: '노출 여부' },
] as const;

const STATUS_CONFIG: Record<
  ScheduledJob['status'],
  { label: string; variant: 'secondary' | 'default' | 'outline'; className?: string }
> = {
  PENDING: { label: '대기', variant: 'secondary' },
  RUNNING: { label: '실행중', variant: 'default' },
  SUCCESS: { label: '완료', variant: 'outline', className: 'border-green-500 bg-green-50 text-green-700' },
  FAILED: { label: '실패', variant: 'outline', className: 'border-red-500 bg-red-50 text-red-700' },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatFieldLabel(field: string): string {
  return FIELD_OPTIONS.find((o) => o.value === field)?.label ?? field;
}

const SALE_STATUS_OPTIONS = [
  { value: 'ON_SALE', label: '판매중' },
  { value: 'STOP_SELLING', label: '판매중지' },
  { value: 'SOLD_OUT', label: '품절' },
] as const;

const DISPLAY_STATUS_OPTIONS = [
  { value: 'VISIBLE', label: '노출' },
  { value: 'HIDDEN', label: '숨김' },
] as const;

export function ScheduledChangesPanel({ productId }: ScheduledChangesPanelProps) {
  const [jobs, setJobs] = React.useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [runningJobId, setRunningJobId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  const [scheduledAt, setScheduledAt] = React.useState('');
  const [field, setField] = React.useState<string>(FIELD_OPTIONS[0].value);
  const [value, setValue] = React.useState('');

  const fetchJobs = React.useCallback(async () => {
    try {
      const res = await fetch('/api/scheduled-jobs');
      if (!res.ok) throw new Error('예약 목록을 불러올 수 없습니다.');
      const data = await res.json();
      const items: ScheduledJob[] = data.items ?? data.data?.items ?? [];
      const filtered = items.filter((job) => job.targetProductIds?.includes(productId));
      setJobs(filtered);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '예약 목록 조회 실패');
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduledAt) {
      toast.error('실행 시각을 입력해주세요.');
      return;
    }
    if (!value) {
      toast.error('변경 값을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const parsedValue = field === 'priceKrw' ? Number(value) : value;
      const res = await fetch('/api/scheduled-jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jobType: 'PRODUCT_UPDATE',
          scheduledAt: new Date(scheduledAt).toISOString(),
          payloadJson: { field, value: parsedValue },
          targetProductIds: [productId],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? '예약 생성에 실패했습니다.');
      }
      toast.success('예약이 생성되었습니다.');
      setShowForm(false);
      setScheduledAt('');
      setValue('');
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '예약 생성 실패');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRun(jobId: string) {
    setRunningJobId(jobId);
    try {
      const res = await fetch(`/api/scheduled-jobs/${jobId}/run`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? '예약 실행에 실패했습니다.');
      }
      toast.success('예약이 실행되었습니다.');
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '예약 실행 실패');
    } finally {
      setRunningJobId(null);
    }
  }

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">예약 수정</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? '취소' : '새 예약 생성'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-md border p-3 bg-muted/30">
          <div className="space-y-1">
            <Label htmlFor="scheduled-at">실행 시각</Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="change-field">변경 항목</Label>
            <select
              id="change-field"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={field}
              onChange={(e) => {
                setField(e.target.value);
                setValue('');
              }}
            >
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="change-value">변경 값</Label>
            {field === 'priceKrw' ? (
              <Input
                id="change-value"
                type="number"
                placeholder="29900"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : field === 'saleStatus' ? (
              <select
                id="change-value"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">선택하세요</option>
                {SALE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="change-value"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">선택하세요</option>
                {DISPLAY_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <Button type="submit" size="sm" disabled={isCreating}>
            {isCreating ? '생성 중...' : '생성'}
          </Button>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">예약된 수정 사항이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => {
            const cfg = STATUS_CONFIG[job.status];
            const payload = job.payloadJson as { field?: string; value?: unknown };
            return (
              <li key={job.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant={cfg.variant} className={cfg.className}>
                    {cfg.label}
                  </Badge>
                  <span className="text-muted-foreground">{formatDateTime(job.scheduledAt)}</span>
                  <span className="truncate">
                    {payload.field ? `${formatFieldLabel(payload.field)}: ${payload.value}` : '—'}
                  </span>
                </div>
                {job.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 shrink-0"
                    disabled={runningJobId === job.id}
                    onClick={() => handleRun(job.id)}
                  >
                    {runningJobId === job.id ? '실행 중...' : '지금 실행'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
