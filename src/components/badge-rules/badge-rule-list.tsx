'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export interface BadgeRuleConditionView {
  id: string;
  conditionType: string;
  operator: string;
  valueJson: { field?: string; value?: string };
  sortOrder: number;
}

export interface BadgeRuleView {
  id: string;
  name: string;
  badgeLabel: string;
  badgeType: string;
  priority: number;
  isActive: boolean;
  displayStartAt: string | null;
  displayEndAt: string | null;
  conditions: BadgeRuleConditionView[];
}

interface BadgeRuleListProps {
  rules: BadgeRuleView[];
  onToggle: (id: string, isActive: boolean) => void;
}

function formatCondition(c: BadgeRuleConditionView): string {
  const operatorMap: Record<string, string> = {
    EQ: '=',
    NEQ: '≠',
    GT: '>',
    GTE: '≥',
    LT: '<',
    LTE: '≤',
  };
  const field = c.valueJson?.field ?? '';
  const value = c.valueJson?.value ?? '';
  return `${field} ${operatorMap[c.operator] ?? c.operator} ${value}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('ko-KR');
  } catch {
    return dateStr;
  }
}

export function BadgeRuleList({ rules, onToggle }: BadgeRuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        등록된 배지 규칙이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{rule.name}</span>
              <Badge variant="secondary">{rule.badgeLabel}</Badge>
              <span className="text-xs text-muted-foreground">우선순위: {rule.priority}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              기간: {formatDate(rule.displayStartAt)} ~ {formatDate(rule.displayEndAt)}
            </div>
            {rule.conditions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                조건: {rule.conditions.map(formatCondition).join(', ')}
              </div>
            )}
          </div>
          <Switch
            checked={rule.isActive}
            onCheckedChange={(checked) => onToggle(rule.id, checked)}
          />
        </div>
      ))}
    </div>
  );
}
