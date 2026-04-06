import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

import { LogoutButton } from '@/components/auth/logout-button';
import { fetchInternalApi } from '@/lib/internal-api';

export const metadata: Metadata = {
  title: 'StoreFlow',
  description: 'Imweb 상품 운영을 위한 StoreFlow 관리 콘솔',
  openGraph: {
    title: 'StoreFlow',
    description: 'Imweb 상품 운영을 위한 StoreFlow 관리 콘솔',
    siteName: 'StoreFlow',
  },
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
                <h1 className="text-2xl font-semibold">StoreFlow</h1>
                <p className="text-sm text-muted-foreground">
                  {session?.workspace
                    ? `${session.workspace.name} 기준 상품 운영 화면`
                    : 'Imweb 상품 운영을 위한 StoreFlow 관리 콘솔'}
                </p>
              </div>
              {session ? <LogoutButton /> : null}
            </div>
            <nav className="mt-2 flex flex-wrap gap-4 text-sm font-medium">
              <Link href="/" className="text-muted-foreground transition hover:text-foreground">
                대시보드
              </Link>
              <Link href="/control-center" className="text-muted-foreground transition hover:text-foreground">
                제어 센터
              </Link>
              <Link href="/badge-rules" className="text-muted-foreground transition hover:text-foreground">
                배지 규칙
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
