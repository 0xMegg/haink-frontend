import { BadgeRulesClient } from '@/components/badge-rules/badge-rules-client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function BadgeRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">배지 규칙 관리</h2>
        <p className="text-sm text-muted-foreground">상품에 자동 적용할 배지 규칙을 관리합니다.</p>
      </div>
      <BadgeRulesClient />
    </div>
  );
}
