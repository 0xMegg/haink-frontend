import Link from 'next/link';
import { redirect } from 'next/navigation';

import { fetchInternalApi } from '@/lib/internal-api';
import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';
import { buildOnboardingRedirectPath } from '@/lib/onboarding-redirect';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

type ShippingProfileDto = {
  id: string;
  name: string;
  base_country: string;
  method: string;
  bundle_allowed: boolean;
};

export default async function NewProductPage() {
  const session = await fetchInternalApi<{
    onboardingState: 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';
  } | null>('/api/auth/session', {
    fallback: null,
  });

  if (!session) {
    redirect('/login');
  }
  if (session.onboardingState !== 'READY') {
    redirect(buildOnboardingRedirectPath('/products/new'));
  }

  const shippingProfiles = await fetchInternalApi<ShippingProfileDto[]>('/api/shipping-profiles', {
    fallback: [],
  });

  const profileOptions = shippingProfiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    description: `${profile.base_country} · ${profile.method}${profile.bundle_allowed ? ' · 묶음배송' : ''}`,
  }));
  if (profileOptions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6 text-sm">
          배송 프로필이 없습니다. 제어 센터에서 최소 1개의 Shipping Profile을 생성한 뒤 다시 시도하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">신규 상품 등록</h2>
          <p className="text-sm text-muted-foreground">카테고리 ID, 가격 등 필수 정보를 입력하세요.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">목록으로</Link>
        </Button>
      </div>
      <ProductForm mode="create" shippingProfiles={profileOptions} />
    </div>
  );
}
