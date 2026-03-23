'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mapSyncErrorMessage } from '@/lib/reviewer-readiness';

interface PendingItem {
  id: string;
  name: string;
  masterCode: string | null;
  createdAt: string;
  lastSyncedAt: string | null;
  lastSyncDirection: string | null;
}

interface Props {
  totalProducts: number;
  syncedCount: number;
  initialItems: PendingItem[];
}

export function EcountSyncPanel({ totalProducts, syncedCount, initialItems }: Props) {
  const [items, setItems] = React.useState(initialItems);
  const [targetId, setTargetId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSync = async (productId: string) => {
    try {
      setTargetId(productId);
      setError(null);
      const res = await fetch(`/api/products/${productId}/sync-ecount`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? '이카운트 연동에 실패했습니다.');
      }
      toast.success(`${data.data?.name ?? '상품'} 이카운트 연동 완료`);
      setItems((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : null;
      const message = mapSyncErrorMessage(rawMessage);
      setError(message);
      toast.error(message);
    } finally {
      setTargetId(null);
    }
  };

  const waitingCount = items.length;

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold">이카운트 연동 상태</h3>
        <p className="text-sm text-muted-foreground">
          전체 {totalProducts.toLocaleString()}건 중 {syncedCount.toLocaleString()}건이 ECOUNT로 동기화되었습니다.
        </p>
      </div>
      {error ? (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p>{error}</p>
          <p className="mt-1">상품 데이터는 유지됩니다. 환경 설정 확인 후 같은 버튼으로 다시 시도할 수 있습니다.</p>
        </div>
      ) : null}

      {waitingCount === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          모두 최신 상태입니다. 새로운 상품이 생성되면 여기에서 수동으로 재시도할 수 있습니다.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            미연동/재시도 필요 상품 {waitingCount}건 · 최대 15건까지 표시됩니다.
          </p>
          <div className="space-y-3">
            {items.map((item) => {
              const statusLabel = getStatusLabel(item);
              const syncedText = item.lastSyncedAt
                ? `마지막 동기화: ${formatDateTime(item.lastSyncedAt)}`
                : '동기화 이력 없음';
              const isSyncing = targetId === item.id;
              return (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        master_code: {item.masterCode ?? '미발급'} · 생성일 {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <Badge variant={statusLabel.variant}>{statusLabel.label}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <p>{syncedText}</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSync(item.id)}
                      disabled={isSyncing}
                    >
                      {isSyncing ? '동기화 중...' : '이카운트 동기화'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function getStatusLabel(item: PendingItem) {
  if (!item.lastSyncedAt) {
    return { label: '미연동', variant: 'default' as const };
  }
  if (item.lastSyncDirection !== 'PUSH') {
    return { label: '대기', variant: 'secondary' as const };
  }
  return { label: '재동기화 필요', variant: 'secondary' as const };
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}
