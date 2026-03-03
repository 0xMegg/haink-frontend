# Haink Admin Web

Next.js 기반 Master DB 관리 콘솔입니다. 이 리포지토리는 프론트엔드만 포함하며, 백엔드 CLI/배치 코드는 `/Users/mero/Documents/haink`에 남아 있습니다.

## 빠른 시작
```bash
npm install
npm run dev
```

배포는 Vercel을 기준으로 하며, `.env.example`을 참고해 `DATABASE_URL`, `PRODUCT_IMAGE_DIR`, `NEXT_PUBLIC_IMAGE_BASE_URL` 등을 설정하세요.  
IMWEB OAuth 콜백은 프론트-백 계약에 따라 **`POST {BACKEND_BASE_URL}/auth/imweb/exchange`**를 호출하므로 `BACKEND_BASE_URL`를 반드시 `.env.local`과 Vercel 프로젝트 환경 변수 모두에 동일한 값으로 지정해야 합니다. 예시는 `https://api.haink.co.kr`입니다.

## Imweb OAuth 콜백 테스트 방법
- 승인/심사용: 배포된 Vercel 주소에서 `/api/auth/imweb/callback?code=test` 호출 → `/integrations/imweb?status=fail&reason=backend_XXX` 화면만 정상 표출되면 콜백 라우팅이 살아있음을 증명할 수 있습니다.  
- 개발용: 실제 Imweb OAuth 과정을 통해 콜백을 호출 → 백엔드 토큰 교환이 성공하면 `/integrations/imweb?status=success` 메시지가 노출됩니다. 실패 시에는 `/integrations/imweb?status=fail&reason=...`로 이동하므로 Reason 값을 참고해 백엔드/인증 설정을 점검하세요.
