type FetchRequestInit = Parameters<typeof fetch>[1];

export interface MasterProductSnapshot {
  masterCode: string;
  name: string;
  label?: string | null;
  barcode: string;
  priceKrw: number;
  releaseDate: Date;
  descriptionHtml?: string | null;
  displayStatus: boolean;
  inventoryTrack: boolean;
  stockQty?: number | null;
  unit?: string | null;
  categoryIds: string[];
}

export type EcountBulkDatas = Record<string, string>;

export interface EcountSaveBasicProductResult {
  rawResponse: SaveBasicProductResponse;
}

export interface EcountClient {
  saveBasicProduct(data: EcountBulkDatas): Promise<EcountSaveBasicProductResult>;
}

interface EcountClientConfig {
  companyCode: string;
  userId: string;
  apiCertKey: string;
  zone: string;
  language: string;
  baseUrl: string;
  timeoutMs: number;
  sessionSkewMs: number;
}

interface LoginResponse {
  Status?: number | string;
  Message?: string;
  Data?: {
    SESSION_ID?: string;
    EXPIRE_TIME?: string;
    Datas?: {
      SESSION_ID?: string;
      EXPIRE_TIME?: string;
    };
  };
}

interface SaveBasicProductResponse {
  Status?: number | string;
  Message?: string;
  Data?: {
    ResultDetails?: Array<{
      Line?: string;
      IsSuccess?: boolean;
      TotalError?: string;
      Message?: string;
    }>;
  };
}

interface SessionInfo {
  id: string;
  expiresAt: number;
}

class EcountApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;
  readonly code?: string;

  constructor(message: string, options: { status?: number; details?: unknown; code?: string } = {}) {
    super(message);
    this.name = 'EcountApiError';
    this.status = options.status;
    this.details = options.details;
    this.code = options.code;
  }
}

class HttpEcountClient implements EcountClient {
  private readonly config: EcountClientConfig;
  private readonly fetchImpl: typeof fetch;
  private session?: SessionInfo;
  private inflightLogin?: Promise<SessionInfo>;

  constructor(config: EcountClientConfig, fetchImpl: typeof fetch = fetch) {
    this.config = config;
    this.fetchImpl = fetchImpl;
  }

  async saveBasicProduct(data: EcountBulkDatas): Promise<EcountSaveBasicProductResult> {
    if (!data.PROD_CD?.trim()) {
      throw new EcountApiError('PROD_CD 값이 비어 있어 이카운트 품목을 생성할 수 없습니다.');
    }

    return this.withSession(async (sessionId) => {
      const url = new URL('/OAPI/V2/InventoryBasic/SaveBasicProduct', this.config.baseUrl);
      url.searchParams.set('SESSION_ID', sessionId);
      const body = JSON.stringify({
        KEY: 'SaveBasicProduct',
        ProductList: [
          {
            Line: '0',
            BulkDatas: data,
          },
        ],
      });

      const response = await this.request(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
      });

      const parsed = (await response.json()) as SaveBasicProductResponse;

      if (!response.ok || !this.isSuccess(parsed)) {
        const isSessionError = this.isSessionProblem(parsed);
        if (isSessionError) {
          this.invalidateSession();
          throw new EcountApiError(parsed.Message ?? '이카운트 세션이 만료되었습니다.', {
            status: response.status || 401,
            details: parsed,
            code: 'SESSION_EXPIRED',
          });
        }

        const resultMessage = parsed.Data?.ResultDetails?.[0]?.TotalError ?? parsed.Message;
        throw new EcountApiError(resultMessage || '이카운트 품목 연동이 실패했습니다.', {
          status: response.status || 502,
          details: parsed,
        });
      }

      return { rawResponse: parsed };
    });
  }

  private isSuccess(response: SaveBasicProductResponse): boolean {
    const detail = response.Data?.ResultDetails?.[0];
    return Boolean(detail?.IsSuccess ?? String(response.Status ?? '').startsWith('2'));
  }

  private isSessionProblem(response: SaveBasicProductResponse): boolean {
    const detail = response.Data?.ResultDetails?.[0];
    const message = `${detail?.TotalError ?? response.Message ?? ''}`.toUpperCase();
    if (!message) return false;
    return message.includes('SESSION') || message.includes('LOGIN');
  }

  private async withSession<T>(fn: (sessionId: string) => Promise<T>): Promise<T> {
    let session = await this.ensureSession();
    try {
      return await fn(session.id);
    } catch (error) {
      if (error instanceof EcountApiError && error.code === 'SESSION_EXPIRED') {
        session = await this.refreshSession();
        return fn(session.id);
      }
      throw error;
    }
  }

  private async ensureSession(): Promise<SessionInfo> {
    const now = Date.now();
    if (this.session && this.session.expiresAt - this.config.sessionSkewMs > now) {
      return this.session;
    }
    if (!this.inflightLogin) {
      this.inflightLogin = this.login()
        .then((session) => {
          this.session = session;
          return session;
        })
        .finally(() => {
          this.inflightLogin = undefined;
        });
    }
    return this.inflightLogin;
  }

  private async refreshSession(): Promise<SessionInfo> {
    this.invalidateSession();
    return this.ensureSession();
  }

  private invalidateSession() {
    this.session = undefined;
  }

  private async login(): Promise<SessionInfo> {
    const url = new URL('/OAPI/V2/OAPILogin', this.config.baseUrl);
    const body = JSON.stringify({
      COM_CODE: this.config.companyCode,
      USER_ID: this.config.userId,
      API_CERT_KEY: this.config.apiCertKey,
      ZONE: this.config.zone,
      LAN_TYPE: this.config.language,
    });

    const response = await this.request(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });

    const payload = (await response.json()) as LoginResponse;
    if (!response.ok) {
      throw new EcountApiError(payload.Message ?? '이카운트 로그인에 실패했습니다.', {
        status: response.status,
        details: payload,
      });
    }

    const sessionId = payload.Data?.SESSION_ID ?? payload.Data?.Datas?.SESSION_ID;
    if (!sessionId) {
      throw new EcountApiError('이카운트 로그인 응답에 SESSION_ID가 없습니다.', {
        status: response.status,
        details: payload,
      });
    }

    const expiresAt =
      parseExpireTime(payload.Data?.EXPIRE_TIME ?? payload.Data?.Datas?.EXPIRE_TIME) ??
      Date.now() + 10 * 60 * 1000;
    return { id: sessionId, expiresAt };
  }

  private async request(url: string, init: FetchRequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      return await this.fetchImpl(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new EcountApiError('이카운트 API 요청 시간이 초과되었습니다.', {
          status: 408,
        });
      }
      if (error instanceof EcountApiError) {
        throw error;
      }
      throw new EcountApiError(`이카운트 API 호출 중 오류가 발생했습니다: ${error}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

class MockEcountClient implements EcountClient {
  async saveBasicProduct(data: EcountBulkDatas): Promise<EcountSaveBasicProductResult> {
    console.info('[MockEcountClient] SaveBasicProduct 호출', data);
    return { rawResponse: { Status: 200, Data: { ResultDetails: [{ Line: '0', IsSuccess: true }] } } };
  }
}

let cachedClient: EcountClient | null | undefined;
let warnedMissingConfig = false;

export function createEcountClient(): EcountClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  if (process.env.ECOUNT_API_USE_MOCK === 'true') {
    cachedClient = new MockEcountClient();
    return cachedClient;
  }

  const companyCode = process.env.ECOUNT_API_COMPANY_CODE?.trim();
  const userId = process.env.ECOUNT_API_USER_ID?.trim();
  const apiCertKey = process.env.ECOUNT_API_CERT_KEY?.trim();
  const zone = process.env.ECOUNT_API_ZONE?.trim();

  if (!companyCode || !userId || !apiCertKey || !zone) {
    if (!warnedMissingConfig && process.env.NODE_ENV !== 'test') {
      console.warn('ECOUNT API 환경 변수가 설정되지 않아 Ecount 연동을 비활성화합니다.');
      warnedMissingConfig = true;
    }
    cachedClient = null;
    return cachedClient;
  }

  const baseUrl = ensureBaseUrl(process.env.ECOUNT_API_BASE_URL, zone);
  const timeoutMs = Number.parseInt(process.env.ECOUNT_API_TIMEOUT_MS ?? '10000', 10);
  const language = process.env.ECOUNT_API_LANG?.trim() || 'ko-KR';

  cachedClient = new HttpEcountClient({
    companyCode,
    userId,
    apiCertKey,
    zone,
    language,
    baseUrl,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000,
    sessionSkewMs: 30_000,
  });
  return cachedClient;
}

export function buildEcountBulkDatas(snapshot: MasterProductSnapshot): EcountBulkDatas {
  const description = stripHtml(snapshot.descriptionHtml)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  const primaryCategory = snapshot.categoryIds.find((id) => id && id.trim().length > 0);

  const data: Record<string, string | undefined> = {
    PROD_CD: truncate(snapshot.masterCode, 20),
    PROD_DES: truncate(snapshot.name, 100),
    SIZE_FLAG: '1',
    SIZE_DES: truncate(snapshot.label ?? snapshot.name, 60),
    UNIT: (snapshot.unit ?? 'EA').toUpperCase(),
    BAL_FLAG: snapshot.inventoryTrack ? '1' : '0',
    STOCK_YN: snapshot.inventoryTrack ? 'Y' : 'N',
    DISPLAY_YN: snapshot.displayStatus ? 'Y' : 'N',
    BAR_CODE: truncate(snapshot.barcode, 30),
    OUT_PRICE: Math.max(0, Math.trunc(snapshot.priceKrw)).toString(),
    SAFE_STOCK_Q: snapshot.stockQty != null ? Math.max(0, snapshot.stockQty).toString() : undefined,
    REMARKS: description,
    REMARKS_WIN: description,
    VAT_YN: 'Y',
    RELEASE_DATE: formatDate(snapshot.releaseDate),
    title: snapshot.name,
    format: primaryCategory,
    출고단가: Math.max(0, Math.trunc(snapshot.priceKrw)).toString(),
    품목코드: snapshot.barcode,
    발매일: formatHumanDate(snapshot.releaseDate),
    구매처: snapshot.label ?? undefined,
  };

  return pruneUndefined(data);
}

function pruneUndefined(input: Record<string, string | undefined>): Record<string, string> {
  return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string' && value.length > 0) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function truncate(value: string, length: number): string {
  if (!value) return '';
  if (value.length <= length) return value;
  if (length <= 3) {
    return value.slice(0, length);
  }
  return `${value.slice(0, length - 3)}...`;
}

function stripHtml(value?: string | null): string {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ');
}

function formatDate(date: Date): string {
  const iso = new Date(date).toISOString();
  return iso.slice(0, 10).replace(/-/g, '');
}

function formatHumanDate(date: Date): string {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function parseExpireTime(value?: string): number | null {
  if (!value || value.length !== 14) return null;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const parsed = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
  return Number.isNaN(parsed) ? null : parsed;
}

function ensureBaseUrl(customBaseUrl: string | undefined, zone: string): string {
  if (customBaseUrl?.trim()) {
    return appendTrailingSlash(customBaseUrl.trim());
  }
  const normalizedZone = zone.toUpperCase();
  return appendTrailingSlash(`https://sboapi${normalizedZone}.ecount.com`);
}

function appendTrailingSlash(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    throw new Error(`잘못된 ECOUNT_API_BASE_URL 값입니다: ${url}`);
  }
}

export { EcountApiError };
