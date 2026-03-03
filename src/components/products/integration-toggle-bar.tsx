'use client';

import * as React from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Switch } from '@/components/ui/switch';

interface Props {
  imwebOnly: boolean;
  ecountOnly: boolean;
}

export function IntegrationToggleBar({ imwebOnly, ecountOnly }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = React.useCallback(
    (key: 'imweb' | 'ecount', checked: boolean) => {
      const params = new URLSearchParams(searchParams ?? undefined);
      if (checked) {
        params.set(key, '1');
      } else {
        params.delete(key);
      }
      const query = params.toString();
      const target = (query ? `${pathname}?${query}` : pathname) as Route;
      router.push(target, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ToggleCard
        label="아임웹 연동"
        description="IMWEB 매핑된 상품만 보기"
        checked={imwebOnly}
        onCheckedChange={(checked) => handleChange('imweb', checked)}
      />
      <ToggleCard
        label="이카운트 연동"
        description="ECOUNT 동기 완료 상품만 보기"
        checked={ecountOnly}
        onCheckedChange={(checked) => handleChange('ecount', checked)}
      />
    </div>
  );
}

interface ToggleCardProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleCard({ label, description, checked, onCheckedChange }: ToggleCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <div>
        <p className="text-sm font-semibold leading-none">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}
