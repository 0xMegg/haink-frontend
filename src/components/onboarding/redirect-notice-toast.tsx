'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

type RedirectNoticeToastProps = {
  nextAction: string;
};

const ROUTE_LABELS: Record<string, string> = {
  '/': '대시보드',
  '/control-center': '제어 센터',
  '/products/new': '신규 상품 등록',
};

export function RedirectNoticeToast({ nextAction }: RedirectNoticeToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledReasonsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const reason = searchParams.get('reason');
    const from = searchParams.get('from');
    const auth = searchParams.get('auth');

    if (auth === 'signup_success' && !handledReasonsRef.current.has('signup_success')) {
      handledReasonsRef.current.add('signup_success');
      toast.success('회원가입이 완료되었습니다. 이어서 초기 설정을 진행해 주세요.');
    }

    if (reason === 'incomplete_setup' && !handledReasonsRef.current.has('incomplete_setup')) {
      handledReasonsRef.current.add('incomplete_setup');
      const routeLabel = ROUTE_LABELS[from ?? ''] ?? '요청한 화면';
      toast.info(`${routeLabel}로 이동하려면 초기 설정을 먼저 완료해야 합니다. 지금은 onboarding에서 ${nextAction} 진행해 주세요.`);
    }

    if (auth !== 'signup_success' && reason !== 'incomplete_setup') {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete('auth');
    nextSearchParams.delete('reason');
    nextSearchParams.delete('from');
    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [nextAction, pathname, router, searchParams]);

  return null;
}
