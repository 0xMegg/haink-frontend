import Link from 'next/link';

const features = [
  {
    title: '상품 수정 예약',
    description: '세일 시작 시각에 맞춰 가격·상태를 자동 변경합니다. 수동 작업 없이 정시에 반영되어 놓치는 타이밍이 없습니다.',
    icon: '📅',
  },
  {
    title: '조건부 썸네일 뱃지',
    description: '조건에 따라 NEW, SALE 등 뱃지를 상품 썸네일에 자동 적용합니다. 규칙 한 번 설정으로 수백 개 상품을 관리하세요.',
    icon: '🏷️',
  },
  {
    title: '통합 관리',
    description: '아임웹과 이카운트의 재고·상품 정보를 한 화면에서 통합 관리합니다. 채널 간 데이터 불일치를 줄여줍니다.',
    icon: '🔗',
  },
];

export function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="flex w-full flex-col items-center gap-6 py-16 text-center sm:py-24">
        <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          아임웹 상품 운영 자동화
        </h2>
        <p className="max-w-xl text-lg text-muted-foreground">
          StoreFlow는 상품 수정 예약, 뱃지 자동 적용, 멀티 채널 통합 관리까지 — 아임웹 셀러를 위한 운영 자동화 플랫폼입니다.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          무료로 시작하기
        </Link>
      </section>

      {/* Features */}
      <section className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border bg-card p-6 transition hover:shadow-md"
          >
            <span className="text-3xl" role="img" aria-label={feature.title}>
              {feature.icon}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-card-foreground">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="flex w-full flex-col items-center gap-4 py-16 text-center sm:py-20">
        <h3 className="text-2xl font-semibold text-foreground">
          지금 바로 운영을 자동화하세요
        </h3>
        <p className="text-sm text-muted-foreground">
          가입은 무료이며, 아임웹 스토어 연동까지 3분이면 충분합니다.
        </p>
        <Link
          href="/login"
          className="inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          지금 시작하기
        </Link>
      </section>
    </div>
  );
}
