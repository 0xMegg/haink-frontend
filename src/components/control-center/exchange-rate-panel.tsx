'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ExchangeRateRow = {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: string;
  effective_from: string;
};

interface Props {
  initialRates: ExchangeRateRow[];
}

export function ExchangeRatePanel({ initialRates }: Props) {
  const [rates, setRates] = React.useState<ExchangeRateRow[]>(() => initialRates.map(normalizeRow));
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draftRate, setDraftRate] = React.useState('');
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [createBase, setCreateBase] = React.useState('KRW');
  const [createTarget, setCreateTarget] = React.useState('USD');
  const [createRate, setCreateRate] = React.useState('1100');
  const [createDate, setCreateDate] = React.useState(() => new Date().toISOString().slice(0, 10));

  const handleSelect = (row: ExchangeRateRow) => {
    setSelectedId(row.id);
    setDraftRate(row.rate);
  };

  const handleUpdate = async () => {
    if (!selectedId) return;
    const parsed = Number(draftRate);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('유효한 환율을 입력하세요.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/exchange-rates/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parsed }),
      });
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error(data.error ?? '환율 업데이트에 실패했습니다.');
      }
      toast.success('환율이 갱신되었습니다.');
      setRates((prev) => prev.map((row) => (row.id === selectedId ? normalizeRow(data.data) : row)));
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    } finally {
      setSubmitting(false);
      setSelectedId(null);
      setDraftRate('');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/exchange-rates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '삭제에 실패했습니다.');
      }
      toast.success('환율이 삭제되었습니다.');
      setRates((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(createRate);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error('유효한 환율을 입력하세요.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseCurrency: createBase,
          targetCurrency: createTarget,
          rate: parsed,
          effectiveFrom: createDate,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.data) {
        throw new Error(data.error ?? '환율 생성에 실패했습니다.');
      }
      toast.success('환율이 추가되었습니다.');
      setRates((prev) => [normalizeRow(data.data), ...prev]);
      setCreateDate(new Date().toISOString().slice(0, 10));
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold">환율 관리</h3>
        <p className="text-sm text-muted-foreground">글로벌 가격 산출에 사용되는 환율을 관리하세요.</p>
      </div>

      <div className="space-y-4">
        <div className="max-h-64 overflow-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">통화</th>
                <th className="px-3 py-2">환율</th>
                <th className="px-3 py-2">기준일</th>
                <th className="px-3 py-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-muted-foreground">
                    아직 등록된 환율이 없습니다.
                  </td>
                </tr>
              ) : (
                rates.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2 font-medium">
                      {row.base_currency} → {row.target_currency}
                    </td>
                    <td className="px-3 py-2">{row.rate}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{row.effective_from}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleSelect(row)}>
                        갱신
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedId ? (
          <div className="rounded-md border p-3">
            <Label className="text-sm font-medium">새 환율 값</Label>
            <div className="mt-2 flex gap-2">
              <Input value={draftRate} onChange={(event) => setDraftRate(event.target.value)} />
              <Button type="button" onClick={handleUpdate} disabled={isSubmitting}>
                저장
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSelectedId(null)} disabled={isSubmitting}>
                취소
              </Button>
            </div>
          </div>
        ) : null}

        <form className="rounded-md border p-3 space-y-3" onSubmit={handleCreate}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baseCurrency">기준 통화</Label>
              <Input id="baseCurrency" value={createBase} onChange={(event) => setCreateBase(event.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetCurrency">대상 통화</Label>
              <Input id="targetCurrency" value={createTarget} onChange={(event) => setCreateTarget(event.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rate">환율</Label>
              <Input id="rate" type="number" step="0.0001" min="0" value={createRate} onChange={(event) => setCreateRate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="effective">기준일</Label>
              <Input id="effective" type="date" value={createDate} onChange={(event) => setCreateDate(event.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            환율 추가
          </Button>
        </form>
      </div>
    </section>
  );
}

function normalizeRow(row: ExchangeRateRow): ExchangeRateRow {
  return {
    ...row,
    rate: Number(row.rate).toFixed(4),
    effective_from: new Date(row.effective_from).toISOString().slice(0, 10),
  };
}
