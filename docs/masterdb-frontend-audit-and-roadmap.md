# MasterDB Frontend Audit and Roadmap

## 1. 문서 목적

이 문서는 현재 MasterDB frontend의 실제 구현 상태를 점검한 결과를 정리하고,  
그 결과를 바탕으로 우선 개선해야 할 항목과 이후 개발 방향을 명확히 하기 위해 작성한다.

이 문서의 목적은 다음과 같다.

- 현재 frontend의 구현 수준을 과장 없이 정리한다.
- 지금 당장 개선해야 할 구조적 문제를 우선순위로 정리한다.
- MasterDB의 단기 목표와 장기 목표를 기준으로 frontend 방향성을 정한다.
- 이후 개발 시 판단 기준으로 사용할 수 있는 기준 문서 역할을 한다.

---

## 2. 현재 MasterDB frontend의 역할

### 2.1 단기 역할

현재 frontend의 1차 역할은 아임웹과 이카운트 운영을 보조하는  
**내부용 admin 성격의 운영 도구**를 제공하는 것이다.

특히 다음과 같은 목적을 가진다.

- 상품 목록 조회
- 상품 등록 / 수정 / 삭제
- 이미지 업로드
- 마스터코드 관리
- 환율 관리
- ECOUNT sync 실행
- IMWEB OAuth 결과 확인

즉 현재 frontend는 단순 showcase UI가 아니라,  
**실제 운영 작업을 수행할 수 있는 내부용 UI**에 가깝다.

### 2.2 장기 역할

장기적으로 frontend는 다음 방향으로 확장되어야 한다.

- 아임웹 + 이카운트 통합 운영 콘솔
- 아임웹에 없는 기능을 제공하는 운영 UI
  - 예약 CRUD
  - 카테고리별 썸네일 뱃지 관리
- 장기적으로 자사몰 운영 백오피스의 초기 기반

즉 frontend는 현재의 단순 상품 관리 화면을 넘어,  
향후 **하인크 운영 콘솔**로 발전할 수 있어야 한다.

---

## 3. 이번 점검을 통해 확인된 현재 frontend 상태

### 3.1 전체 판단

현재 frontend는 단순 mock UI가 아니라,  
`Next.js 14 App Router` 기반의 **functional internal admin tool**이다.

현재 확인된 핵심 구성은 다음과 같다.

- Next.js 14 + App Router
- 상품 목록 / 신규 등록 / 수정 화면
- Control Center 운영 화면
- IMWEB OAuth 결과 화면
- 동일 앱 내부의 `app/api/*` Route Handler
- Prisma + PostgreSQL 직접 접근
- ECOUNT API / IMWEB backend / S3 image storage 연동

현재 상태를 한 문장으로 정리하면 다음과 같다.

> 현재 frontend는 "실제로 동작하는 내부 운영 도구" 수준이며,  
> 완성형 운영 콘솔이나 production-ready admin system으로 보기는 어렵다.

---

## 4. 점검 결과 요약

### 4.1 구현 성숙도 판단

| 영역 | 현재 판단 |
|---|---|
| Frontend structure | Functional |
| Admin UI | Functional |
| Product workflow | Functional |
| API integration | Functional |
| State/form handling | Functional |
| Auth/access control | Not implemented |
| Responsibility boundary | Partially implemented |
| Extensibility | Partially implemented |

### 4.2 핵심 해석

현재 frontend의 강점은 다음과 같다.

- 상품 관리와 운영 패널 UI가 실제로 존재한다.
- 단순 mock이 아니라 DB write와 외부 연동까지 연결되어 있다.
- 상품 목록 / 등록 / 수정 / 삭제 / 업로드 / sync 흐름이 실제로 구현되어 있다.
- Next.js 앱 내부에서 필요한 운영 기능을 빠르게 구현할 수 있는 구조를 가지고 있다.

반면 현재 frontend의 한계는 다음과 같다.

- 사용자 인증 / 권한 / route protection이 없다.
- UI, API route, DB access, integration orchestration이 한 앱에 혼합되어 있다.
- 기능 범위가 아직 좁고 운영 정보구조(IA)가 단순하다.
- 확장 가능한 feature boundary가 약하다.
- 장기적으로 운영 콘솔이 커지면 page/API 복잡도가 빠르게 증가할 수 있다.

---

## 5. 기존 개발 요약 문구에 대한 판단

### 5.1 비교 결과

| 표현 | 판단 |
|---|---|
| Admin UI implemented | 적절 |
| Product management screen implemented | 적절 |
| Frontend system established | 적절 |
| Operational admin interface implemented | 부분적으로만 적절 |
| Production-ready admin system | 과장 |

### 5.2 해석

현재 repository 기준으로는 다음 표현이 더 정확하다.

- 운영용 admin UI가 구현되어 있다.
- 상품 관리 화면과 관련 workflow가 구현되어 있다.
- frontend 시스템은 기본적으로 구축되어 있다.
- 다만 완성형 운영 콘솔이나 production-ready admin system으로 보기는 어렵다.

---

## 6. 현재 frontend의 구조적 강점

### 6.1 실제 운영 도구로서의 실체가 있음

현재 frontend는 단순히 화면만 있는 것이 아니라 다음 흐름이 실제로 존재한다.

- 상품 조회
- 상품 생성 / 수정
- 상품 삭제
- 이미지 업로드
- 마스터코드 관리
- 환율 관리
- ECOUNT sync
- IMWEB OAuth 결과 확인

즉 “prototype UI”가 아니라  
**실제로 사용 가능한 내부 운영 도구**라는 점이 중요하다.

### 6.2 App Router 기반 구조가 명확함

`app/`, `app/(dashboard)/`, `app/api/*`, `src/components/`, `src/lib/` 구조가 존재하고,  
현재 규모에서는 비교적 빠르게 기능을 추가할 수 있는 형태다.

### 6.3 form/schema 구성이 어느 정도 정리되어 있음

`react-hook-form`과 `zod` 중심으로 form을 다루고 있어,  
현재 범위에서는 실용적인 구조를 갖추고 있다.

### 6.4 backend-for-frontend 역할을 빠르게 수행할 수 있음

Next app 내부의 `app/api/*` Route Handler를 통해  
UI와 운영 로직을 빠르게 연결할 수 있는 구조가 이미 있다.

---

## 7. 현재 frontend의 핵심 문제

### 7.1 인증 / 접근 제어 부재

현재 repo 기준으로는 다음이 확인되지 않는다.

- 로그인
- 세션 관리
- route guard
- middleware 기반 접근 제한
- 역할/권한 관리

내부 도구라고 하더라도 삭제/업로드/수정 API가 보호 없이 열려 있는 구조는  
운영 도구로서 가장 큰 리스크 중 하나다.

### 7.2 책임 경계 혼합

현재 frontend는 다음 역할을 동시에 수행한다.

- 화면 렌더링
- form 처리
- API handler
- DB 접근
- 외부 연동 orchestration

현재 범위에서는 빠르고 실용적이지만,  
기능이 늘어날수록 `app/api/*`와 page 로직이 비대해질 가능성이 크다.

### 7.3 운영 정보구조(IA) 단순함

현재는 `/`, `/control-center`, `/products/*`, `/integrations/imweb` 정도로 구조가 단순하다.

이 상태에서는 다음 기능이 추가될 때 곧 한계가 올 수 있다.

- 예약 CRUD
- 썸네일 뱃지 규칙
- 통합 운영 기능
- 운영 로그 / 히스토리
- 확장된 catalog 관리

### 7.4 공통 API client / mutation 패턴 부족

현재 범위에서는 각 화면이 자체적으로 fetch와 toast 처리를 반복하는 구조여도 버틸 수 있다.  
하지만 기능이 늘어나면 다음 문제가 생길 수 있다.

- 에러 처리 중복
- loading 처리 중복
- response contract 불일치
- mutation 후 UI 갱신 패턴 불일치

### 7.5 확장 가능한 feature 구조 부족

현재는 `products`, `control-center`, `integrations` 정도로 묶여 있지만,  
장기적으로 운영 콘솔이 커질 경우 feature 단위 재구성이 필요하다.

---

## 8. 지금 당장 개선해야 할 우선순위

### Priority 1. 최소한의 Auth / Route Protection 추가

목표: 내부 운영 도구로서 최소한의 보호 장치를 만든다.

우선 필요한 것:

- 관리자 진입 보호
- 주요 API route 보호
- 삭제/업로드/수정 route에 대한 최소 인증
- 내부망/VPN 전제가 아니라면 확실한 access control 도입

이 단계는 현재 구조의 가장 큰 공백을 메우는 작업이다.

---

### Priority 2. 상품 목록을 운영용 grid로 강화

목표: 현재 상품 관리 화면을 “있다” 수준에서 “실제로 쓰기 편하다” 수준으로 올린다.

우선 필요한 것:

- 검색
- pagination
- 정렬
- 상태 필터
- 채널 필터

현재 상품 관리 화면은 실제 workflow는 존재하지만,  
운영 효율 측면에서는 아직 더 강화될 필요가 있다.

---

### Priority 3. API client / mutation 패턴 표준화

목표: 앞으로 기능이 늘어나도 fetch/mutation 구조가 흩어지지 않게 한다.

우선 필요한 것:

- 공통 fetch wrapper 정리
- typed response 패턴 정리
- error normalization
- loading / success / failure 처리 기준 정리
- form submit 후 갱신 정책 통일

이 단계는 reservation CRUD, badge management 같은 다음 기능을 올릴 때 중요하다.

---

### Priority 4. Control Center 기능 분해

목표: 현재 한 페이지에 모여 있는 운영 기능을 feature 단위로 나눈다.

예시 방향:

- `/operations/master-codes`
- `/operations/exchange-rates`
- `/operations/sync`
- `/operations/catalog-rules`

이 단계가 되어야 이후 운영 기능을 덧붙여도 구조가 무너지지 않는다.

---

### Priority 5. feature module 구조로 재정비

목표: 장기 확장 가능한 admin frontend 구조를 만든다.

예시 방향:

- `src/features/products`
- `src/features/integrations`
- `src/features/operations`
- `src/features/reservations`
- `src/features/catalog-rules`

현재 구조는 기능 수가 적을 때는 충분하지만,  
장기적으로는 page/component/lib 기준보다 feature 중심 구조가 더 적합하다.

---

## 9. 단기 개발 방향

현재 목표를 고려할 때 frontend의 단기 방향은 다음과 같다.

### 9.1 목표
아임웹 + 이카운트 통합 운영을 위한 내부용 운영 UI 강화

### 9.2 단기적으로 우선 들어가야 할 기능
- 상품 운영 탐색성 강화
- 예약 CRUD UI
- 카테고리별 썸네일 뱃지 관리 UI
- sync 실행/상태 관리 UI
- 운영 기능 분리 및 정리

### 9.3 단기적으로 아직 하지 않아도 되는 것
- 지나치게 큰 디자인 시스템 구축
- 복잡한 frontend micro-frontend 구조
- 자사몰 전체 UI 선구현
- 사용자용 storefront 영역 확장

현재 단계에서는 실용적인 내부 운영 UI가 우선이다.

---

## 10. 장기 개발 방향

장기적으로 frontend는 다음 방향으로 진화해야 한다.

### 10.1 현재
작동하는 내부 admin tool

### 10.2 중기
기능별 운영 콘솔 + 확장 가능한 feature 구조

### 10.3 장기
아임웹 + 이카운트 통합 운영 콘솔이자, 자사몰 운영 백오피스의 기반 UI

즉 진화 방향은 다음과 같다.

`internal tool -> operational console -> commerce admin foundation`

---

## 11. 향후 frontend 개발 원칙

앞으로 frontend는 아래 원칙에 맞춰 개발한다.

### 11.1 “붙이는 방식”보다 feature 단위 확장을 우선한다
새 기능은 기존 page에 계속 누적하기보다, feature 단위 route와 module로 추가한다.

### 11.2 UI와 운영 로직의 경계를 의식한다
현재는 한 앱 안에 섞여 있어도 괜찮지만, 장기적으로는 책임 분리를 염두에 둔다.

### 11.3 운영 기능은 확장 가능한 정보구조 위에 올린다
예약, 뱃지, sync, catalog rule 기능은 Control Center에 단순 추가하지 않고 구조적으로 분리한다.

### 11.4 form / mutation / feedback 패턴을 통일한다
앞으로 기능이 늘수록 사용성과 유지보수성 차이가 크게 난다.

### 11.5 auth와 운영 안전성을 뒤로 미루지 않는다
내부 도구라도 수정/삭제/업로드 기능이 있다면 최소한의 access control은 조기에 도입해야 한다.

---

## 12. 다음 액션

### 즉시 진행
1. 주요 route 및 API에 대한 auth / route protection 추가
2. 상품 목록 검색 / pagination / 정렬 강화
3. 공통 API client / error handling 패턴 정리
4. Control Center 기능 분리 설계
5. reservation / badge management UI를 위한 feature 구조 초안 설계

### 이후 진행
1. feature module 구조로 재정비
2. sync 관련 UI/상태 관리 정리
3. 운영 로그 / 히스토리 UI 고려
4. 역할/권한 구조 추가
5. 장기적으로 자사몰 운영 콘솔을 염두에 둔 IA 고도화

---

## 13. 결론

현재 MasterDB frontend는  
**functional internal admin tool**로 보는 것이 가장 정확하다.

즉 실제 운영 기능이 연결된 내부 도구로서의 실체는 충분히 있으나,  
완성형 운영 콘솔이나 production-ready admin system으로 보기에는 아직 부족하다.

따라서 다음 단계의 핵심은  
단순히 화면을 더 추가하는 것이 아니라,  
현재의 작동하는 내부 도구를  
**확장 가능한 운영 콘솔 구조로 정리하는 것**이다.

이 전환이 이루어져야,  
MasterDB frontend는 단기적으로는 아임웹 + 이카운트 통합 운영 UI가 되고,  
장기적으로는 하인크 자사몰 운영 백오피스의 기반이 될 수 있다.
