'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleClick = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
    router.replace('/login');
    router.refresh();
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick}>
      로그아웃
    </Button>
  );
}
