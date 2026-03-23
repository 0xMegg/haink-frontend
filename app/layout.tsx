import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

import { LogoutButton } from '@/components/auth/logout-button';
import { fetchInternalApi } from '@/lib/internal-api';

export const metadata: Metadata = {
  title: 'Imweb Master DB Admin',
  description: 'Imweb 상품 마스터 DB 관리 도구',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await fetchInternalApi<{
    workspace: {
      name: string;
    } | null;
  } | null>('/api/auth/session', {
    fallback: null,
  });

  return (
    <html lang="ko">
      <body className="min-h-screen bg-background text-foreground font-sans">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <header className="mb-8 flex flex-col gap-2 border-b pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Imweb Master DB Admin</h1>
                <p className="text-sm text-muted-foreground">
                  {session?.workspace ? `${session.workspace.name} 기준 상품 운영 화면` : '상품 등록 및 수정을 위한 내부용 도구'}
                </p>
              </div>
              {session ? <LogoutButton /> : null}
            </div>
            <nav className="mt-2 flex flex-wrap gap-4 text-sm font-medium">
              <Link href="/" className="text-muted-foreground transition hover:text-foreground">
                대시보드
              </Link>
              <Link href="/onboarding" className="text-muted-foreground transition hover:text-foreground">
                온보딩
              </Link>
              <Link href="/control-center" className="text-muted-foreground transition hover:text-foreground">
                제어 센터
              </Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
