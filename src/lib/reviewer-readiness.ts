export type BackendOnboardingState = 'NO_WORKSPACE' | 'NO_STORE' | 'NO_PRODUCT' | 'READY';

export type ReviewerOnboardingState = 'PREPARING_WORKSPACE' | 'NOT_CONNECTED' | 'CONNECTED_NO_DATA' | 'READY';

export interface SessionCounts {
  storeConnectionCount: number;
  productCount: number;
}

export function deriveReviewerOnboardingState(state: BackendOnboardingState): ReviewerOnboardingState {
  switch (state) {
    case 'NO_WORKSPACE':
      return 'PREPARING_WORKSPACE';
    case 'NO_STORE':
      return 'NOT_CONNECTED';
    case 'NO_PRODUCT':
      return 'CONNECTED_NO_DATA';
    case 'READY':
    default:
      return 'READY';
  }
}

export function getOnboardingStateCopy(state: ReviewerOnboardingState) {
  switch (state) {
    case 'PREPARING_WORKSPACE':
      return {
        label: 'PREPARING_WORKSPACE',
        title: 'Workspace를 준비하는 단계입니다.',
        description: '첫 workspace를 만든 뒤 Imweb 연결 단계로 이어집니다.',
        nextAction: 'workspace 자동 준비가 끝날 때까지 기다리거나 다시 시도하세요.',
      };
    case 'NOT_CONNECTED':
      return {
        label: 'NOT_CONNECTED',
        title: 'Imweb 연결이 아직 완료되지 않았습니다.',
        description: 'OAuth 연결이 끝나야 상품 import와 제품 검토를 진행할 수 있습니다.',
        nextAction: 'Imweb 연결 시작 버튼으로 store connection을 완료하세요.',
      };
    case 'CONNECTED_NO_DATA':
      return {
        label: 'CONNECTED_NO_DATA',
        title: '스토어는 연결되었지만 아직 가져온 상품이 없습니다.',
        description: '이제 첫 import만 실행하면 제품 목록과 편집 화면으로 바로 이동할 수 있습니다.',
        nextAction: '상품 import 시작 버튼으로 초기 데이터를 가져오세요.',
      };
    case 'READY':
    default:
      return {
        label: 'READY',
        title: '핵심 reviewer flow가 준비되었습니다.',
        description: '상품 목록과 편집 흐름을 바로 검토할 수 있습니다.',
        nextAction: '상품 목록에서 제품을 확인하고 상세 편집 화면으로 이동하세요.',
      };
  }
}

export function mapOAuthFailureReason(reason: string | null | undefined) {
  switch ((reason ?? '').trim().toLowerCase()) {
    case 'missing_code':
      return 'Imweb에서 인증 응답을 완료하지 못했습니다. 연결 시작부터 다시 진행해 주세요.';
    case 'authentication_required':
      return '로그인 세션이 만료되었습니다. 다시 로그인한 뒤 Imweb 연결을 다시 시도해 주세요.';
    case 'missing_workspace_context':
      return 'workspace 준비가 완료되지 않았습니다. onboarding 화면에서 다시 시작해 주세요.';
    case 'missing_backend_base_url':
      return '백엔드 연결 주소가 설정되지 않았습니다. 운영자가 BACKEND_BASE_URL을 확인해야 합니다.';
    case 'network_error':
      return '백엔드와 통신하지 못했습니다. 잠시 후 다시 시도하거나 운영자에게 연결 상태를 확인해 달라고 요청해 주세요.';
    case 'token_exchange_failed':
      return 'Imweb 승인 코드를 처리하지 못했습니다. 잠시 후 다시 연결을 시도해 주세요.';
    case 'invalid_imweb_response':
      return 'Imweb 응답을 확인할 수 없었습니다. 운영자가 Imweb 앱 설정과 Redirect URI를 다시 확인해야 합니다.';
    case 'server_error':
      return '스토어 연결을 저장하는 중 문제가 발생했습니다. 다시 시도해도 같으면 운영자 확인이 필요합니다.';
    case 'imweb_400':
      return 'Imweb이 요청을 거부했습니다. Client ID, Redirect URI, 승인 상태를 확인한 뒤 다시 시도해 주세요.';
    case 'imweb_401':
    case 'imweb_403':
      return 'Imweb 앱 권한이 아직 유효하지 않습니다. 승인 상태와 앱 설정을 다시 확인해 주세요.';
    case 'imweb_404':
      return 'Imweb 토큰 교환 주소를 찾지 못했습니다. 운영자가 IMWEB_TOKEN_URL 설정을 확인해야 합니다.';
    default:
      if ((reason ?? '').startsWith('imweb_5')) {
        return 'Imweb 측 응답이 일시적으로 불안정했습니다. 잠시 후 다시 시도해 주세요.';
      }
      if ((reason ?? '').startsWith('backend_')) {
        return '백엔드에서 연결 요청을 처리하지 못했습니다. 설정과 서버 상태를 확인한 뒤 다시 시도해 주세요.';
      }
      return '스토어 연결에 실패했습니다. 다시 시도해도 같으면 운영자가 Imweb 설정과 백엔드 상태를 확인해야 합니다.';
  }
}

export function mapImportErrorMessage(message: string | null | undefined) {
  const normalized = (message ?? '').toLowerCase();

  if (!normalized) {
    return '상품 import를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (normalized.includes('backend_base_url')) {
    return '백엔드 연결 설정이 비어 있습니다. 운영자가 BACKEND_BASE_URL을 확인해야 합니다.';
  }
  if (normalized.includes('fetch failed') || normalized.includes('network')) {
    return '백엔드와 통신하지 못했습니다. 서버 상태를 확인한 뒤 다시 시도해 주세요.';
  }
  if (normalized.includes('enoent') || normalized.includes('no such file')) {
    return '가져올 import 파일을 찾지 못했습니다. 운영자가 ONBOARDING_IMPORT_FILE_PATH 또는 기본 파일 위치를 확인해야 합니다.';
  }
  if (normalized.includes('shipping profile')) {
    return '기본 배송 프로필이 없어 상품을 만들 수 없습니다. 배송 프로필을 준비한 뒤 다시 시도해 주세요.';
  }
  if (normalized.includes('usable product') || normalized.includes('processed 0')) {
    return '가져온 상품이 없어 다음 단계로 진행하지 못했습니다. Imweb 연결 상태와 import 파일 내용을 다시 확인해 주세요.';
  }
  return '상품 import를 완료하지 못했습니다. 다시 시도해도 같으면 운영자가 import 파일과 백엔드 로그를 확인해야 합니다.';
}

export function mapSyncErrorMessage(message: string | null | undefined) {
  const normalized = (message ?? '').toLowerCase();

  if (!normalized) {
    return '동기화를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  if (normalized.includes('missing_configuration') || normalized.includes('ecount_api')) {
    return 'ECOUNT 연동 설정이 아직 완료되지 않았습니다. 운영자가 ECOUNT credential을 확인해야 합니다.';
  }
  if (normalized.includes('invalid_product') || normalized.includes('master_code')) {
    return '이 상품은 동기화에 필요한 master_code 정보가 없어 먼저 상품 정보를 확인해야 합니다.';
  }
  if (normalized.includes('fetch failed') || normalized.includes('network')) {
    return '동기화 서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
  return '동기화에 실패했습니다. 데이터는 유지되므로 나중에 다시 시도할 수 있습니다.';
}

export function summarizeEnvironmentReadiness() {
  const checks = [
    { name: 'BACKEND_BASE_URL', ready: Boolean(process.env.BACKEND_BASE_URL?.trim()) },
    { name: 'IMWEB_CLIENT_ID', ready: Boolean(process.env.IMWEB_CLIENT_ID?.trim()) },
    { name: 'IMWEB_REDIRECT_URI', ready: Boolean(process.env.IMWEB_REDIRECT_URI?.trim()) },
  ];

  return {
    checks,
    missing: checks.filter((item) => !item.ready).map((item) => item.name),
    ok: checks.every((item) => item.ready),
  };
}
