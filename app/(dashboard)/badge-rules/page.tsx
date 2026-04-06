'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { BadgeRuleForm } from '@/components/badge-rules/badge-rule-form';
import { BadgeRuleList, type BadgeRuleView } from '@/components/badge-rules/badge-rule-list';

export default function BadgeRulesPage() {
  const [rules, setRules] = React.useState<BadgeRuleView[]>([]);
  const [isLoading, setLoading] = React.useState(true);

  const fetchRules = React.useCallback(async () => {
    try {
      const res = await fetch('/api/badge-rules');
      if (!res.ok) throw new Error('규칙 목록을 불러오지 못했습니다.');
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.data?.items ?? data.items ?? [];
      setRules(items);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggle = (id: string, isActive: boolean) => {
    setRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, isActive } : rule))
    );
    toast.success(`배지 규칙이 ${isActive ? '활성화' : '비활성화'}되었습니다.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">배지 규칙 관리</h2>
        <p className="text-sm text-muted-foreground">상품에 자동 적용할 배지 규칙을 관리합니다.</p>
      </div>

      <BadgeRuleForm onCreated={fetchRules} />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">등록된 규칙</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <BadgeRuleList rules={rules} onToggle={handleToggle} />
        )}
      </div>
    </div>
  );
}
