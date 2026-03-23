import { redirect } from 'next/navigation';

import { AuthForm } from '@/components/auth/auth-form';
import { fetchInternalApi } from '@/lib/internal-api';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await fetchInternalApi<{
    workspace: {
      id: string;
    } | null;
    onboardingState: 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';
  } | null>('/api/auth/session', {
    fallback: null,
  });

  if (session) {
    if (session.onboardingState === 'READY') {
      redirect('/');
    }
    redirect('/onboarding');
  }

  return (
    <div className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-12">
      <AuthForm />
    </div>
  );
}
