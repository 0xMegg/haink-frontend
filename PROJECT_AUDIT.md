# Haink Admin Web 점검 결과 (2026-03-03)

## 개요
- Next.js 14 App Router + Prisma/PostgreSQL + AWS S3 + Ecount API를 사용하는 내부 관리자 툴.
- 서버 컴포넌트 단계에서 직접 DB를 조회하며, 제어용 API는 `app/api`에 구현됨.
- 린트/테스트 자동화가 부재하고, 민감 기능에 인증이 없어 보안 리스크가 큼.

## 주요 이슈 요약
1. `/api/products` GET이 `listProducts(50)` 호출로 즉시 크래시 (시그니처 mismatch).
2. `.eslintrc.cjs`의 `settings.next.rootDir`가 존재하지 않는 `apps/admin`을 가리켜 lint가 무한 대기.
3. 빌드/SSR 단계에서 `prisma` 직접 호출로 DB 없으면 `next build`가 중단.
4. `syncProductToEcount`가 Prisma 트랜잭션 안에서 외부 HTTP 호출을 수행해 장기 락 및 실패 전파 위험.
5. `/api/tools/delete-product`, `/api/uploads` 등 고위험 API에 인증/로깅이 전혀 없음.
6. `app/images/[...path]` 폴더가 비어 있어 Next.js가 죽은 라우트를 탐지.

## 개선 권장 사항
- `listProducts({ limit })`로 API 동작 복구 후 통합 테스트 추가.
- `.eslintrc.cjs`를 프로젝트 루트 기준으로 수정하고 `npx next lint --no-cache`를 CI에 포함.
- SSR 단계 DB 접근을 route handler/server action으로 이동하거나 mock DB를 준비해 빌드 안정화.
- Ecount 연동을 트랜잭션 밖 배치/큐로 옮기고 재시도·감사 로그를 적용.
- 전역 middleware로 인증/인가 추가, 파일 업로드·삭제 API에 rate limit 및 감사 로그 도입.
- 죽은 라우트 정리 및 기본 e2e 테스트(Vitest/Playwright) 추가.
