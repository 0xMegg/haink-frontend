'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Mode = 'login' | 'signup';

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = React.useState<Mode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const reason = searchParams.get('reason');
  const reasonMessage = reason === 'auth_required' ? '로그인이 필요합니다.' : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          ...(mode === 'signup' ? { name } : {}),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? '인증 요청에 실패했습니다.');
      }
      router.replace('/onboarding');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '인증 요청에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">HAINK Onboarding</p>
        <h1 className="text-2xl font-semibold text-neutral-950">HAINK 시작하기</h1>
        <p className="text-sm text-neutral-600">로그인 후 workspace, store connection, import 단계로 바로 이어집니다.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 p-1">
        <button
          type="button"
          className={mode === 'login' ? activeTabClassName : inactiveTabClassName}
          onClick={() => setMode('login')}
        >
          로그인
        </button>
        <button
          type="button"
          className={mode === 'signup' ? activeTabClassName : inactiveTabClassName}
          onClick={() => setMode('signup')}
        >
          회원가입
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === 'signup' ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-800">이름</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="홍길동" required />
          </label>
        ) : null}
        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-800">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-neutral-800">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상"
            required
          />
        </label>

        {reasonMessage ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{reasonMessage}</p> : null}
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입 후 시작'}
        </Button>
      </form>
    </div>
  );
}

const activeTabClassName = 'rounded-lg bg-white px-3 py-2 text-sm font-semibold text-neutral-950 shadow-sm';
const inactiveTabClassName =
  'rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-950';
