# Haink Admin Web

Next.js 기반 Master DB 관리 콘솔입니다. 이 리포지토리는 프론트엔드만 포함하며, 백엔드 CLI/배치 코드는 `/Users/mero/Documents/haink`에 남아 있습니다.

## 빠른 시작
```bash
npm install
npm run dev
```

배포는 Vercel을 기준으로 하며, `.env.example`을 참고해 `DATABASE_URL`, `PRODUCT_IMAGE_DIR`, `NEXT_PUBLIC_IMAGE_BASE_URL` 등을 설정하세요.  
IMWEB OAuth 콜백은 프론트-백 계약에 따라 **`POST {BACKEND_BASE_URL}/auth/imweb/exchange`**를 호출하므로 `BACKEND_BASE_URL`를 반드시 `.env.local`과 Vercel 프로젝트 환경 변수 모두에 동일한 값으로 지정해야 합니다. 예시는 `https://api.haink.co.kr`입니다.

## Sprint 9 Reviewer Setup
- 필수 frontend env
  - `BACKEND_BASE_URL`: frontend proxy가 호출할 backend base URL
  - `IMWEB_CLIENT_ID`: Imweb authorize redirect 구성에 사용
  - `IMWEB_REDIRECT_URI`: Imweb callback URL, frontend 배포 URL과 정확히 일치해야 함
- reviewer flow에 직접 영향을 주는 backend env
  - `AUTH_JWT_SECRET`
  - `IMWEB_CLIENT_SECRET`
  - `IMWEB_TOKEN_URL`
  - `ECOUNT_API_COMPANY_CODE`
  - `ECOUNT_API_USER_ID`
  - `ECOUNT_API_CERT_KEY`
  - `ECOUNT_API_ZONE`
- 누락 시 동작
  - `BACKEND_BASE_URL` 누락: login/signup/OAuth callback에서 설정 누락 안내 메시지를 표시합니다.
  - `IMWEB_CLIENT_ID` 또는 `IMWEB_REDIRECT_URI` 누락: `/api/auth/imweb/start`가 `/onboarding?store=misconfigured`로 되돌립니다.
  - backend 미가동 또는 연결 실패: onboarding/import/sync에서 raw error 대신 재시도 또는 운영자 확인 안내를 표시합니다.

## Approval Demo Flow
1. `/login`에서 로그인 또는 회원가입
2. `/onboarding`에서 workspace 자동 준비 확인
3. `Imweb 연결 시작`으로 OAuth 연결
4. `상품 import 시작`으로 초기 상품 적재
5. `/`에서 product list 확인
6. `보기/수정`으로 `/products/[id]` 진입

## Imweb OAuth 콜백 테스트 방법
- 승인/심사용: 배포된 Vercel 주소에서 `/api/auth/imweb/callback?code=test` 호출 → `/integrations/imweb?status=fail&reason=backend_XXX` 화면만 정상 표출되면 콜백 라우팅이 살아있음을 증명할 수 있습니다.  
- 개발용: 실제 Imweb OAuth 과정을 통해 콜백을 호출 → 백엔드 토큰 교환이 성공하면 `/integrations/imweb?status=success` 메시지가 노출됩니다. 실패 시에는 `/integrations/imweb?status=fail&reason=...`로 이동하므로 Reason 값을 참고해 백엔드/인증 설정을 점검하세요.
