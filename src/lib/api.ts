import type {
  AvailabilityResponse,
  FarmSearchResponse,
  IdentificationType,
  MeResponse,
  OtpDestinationKind,
  OtpTransport,
  OtpTransportsResponse,
  RegisterPayload,
  RegisterResponse,
  RequestOtpResponse,
  VerifyOtpResponse,
  AccountVerifyResponse,
  LoginDestination,
  LoginResponse,
} from './types';

const TOKEN_STORAGE_KEY = 'porcia_session_token';

export type ApiErrorCode =
  | 'rate_limited'
  | 'channel_not_configured'
  | 'send_failed'
  | 'invalid_code'
  | 'expired_code'
  | 'too_many_attempts'
  | 'not_found'
  | 'duplicate_identification'
  | 'duplicate_email'
  | 'duplicate_farm'
  | 'already_member'
  | 'phone_not_verified'
  | 'unauthorized'
  | 'validation'
  | 'farm_not_found';

export type ApiError =
  | { kind: 'network' }
  | { kind: 'api'; code: ApiErrorCode; status: number; field?: string; message?: string }
  | { kind: 'unknown'; status: number; message?: string };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const KNOWN_CODES = new Set<string>([
  'rate_limited',
  'channel_not_configured',
  'send_failed',
  'invalid_code',
  'expired_code',
  'too_many_attempts',
  'not_found',
  'duplicate_identification',
  'duplicate_email',
  'duplicate_farm',
  'already_member',
  'phone_not_verified',
  'unauthorized',
  'validation',
  'farm_not_found',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * El backend responde `{ error: { code, message } }` — `body.error` es un
 * OBJETO. Antes esto solo miraba formas planas (`body.error` como string),
 * así que el código NUNCA se reconocía y todo error terminaba como
 * "unknown": la validación de duplicados existía en el servidor pero en
 * pantalla siempre salía "Algo salió mal de nuestro lado".
 */
function extractCode(body: unknown): ApiErrorCode | undefined {
  if (!isRecord(body)) return undefined;
  const nested = isRecord(body.error) ? body.error.code : undefined;
  const candidate = nested ?? body.error ?? body.code;
  if (typeof candidate === 'string' && KNOWN_CODES.has(candidate)) {
    return candidate as ApiErrorCode;
  }
  return undefined;
}

/** Mensaje en español que ya redactó el backend, para no duplicarlo aquí. */
function extractMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  const nested = isRecord(body.error) ? body.error.message : undefined;
  const candidate = nested ?? body.message;
  return typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : undefined;
}

function extractField(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  return typeof body.field === 'string' ? body.field : undefined;
}

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // localStorage puede no estar disponible (modo privado); la sesión
    // simplemente no persiste entre recargas, el registro sigue funcionando.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Igual que storeToken: si no hay localStorage, no hay nada que borrar.
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    const token = getStoredToken();
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.ok) {
    return { ok: true, data: body as T };
  }

  const code = extractCode(body);
  const message = extractMessage(body);
  if (code) {
    return {
      ok: false,
      error: {
        kind: 'api',
        code,
        status: response.status,
        field: extractField(body),
        message,
      },
    };
  }
  return { ok: false, error: { kind: 'unknown', status: response.status, message } };
}

export function getOtpTransports(): Promise<ApiResult<OtpTransportsResponse>> {
  return request<OtpTransportsResponse>('/register/otp-transports');
}

export function requestOtp(
  destination: string,
  destinationKind: OtpDestinationKind,
  transport: OtpTransport,
): Promise<ApiResult<RequestOtpResponse>> {
  return request<RequestOtpResponse>('/register/request-otp', {
    method: 'POST',
    body: JSON.stringify({ destination, destinationKind, transport }),
  });
}

export function verifyOtp(
  destination: string,
  code: string,
): Promise<ApiResult<VerifyOtpResponse>> {
  return request<VerifyOtpResponse>('/register/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ destination, code }),
  });
}

export function searchFarms(query: string): Promise<ApiResult<FarmSearchResponse>> {
  const params = new URLSearchParams({ q: query });
  return request<FarmSearchResponse>(`/register/farms/search?${params.toString()}`);
}

export function submitRegistration(payload: RegisterPayload): Promise<ApiResult<RegisterResponse>> {
  return request<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function requestAccountEmailOtp(destination: string): Promise<ApiResult<RequestOtpResponse>> {
  return request<RequestOtpResponse>('/account/request-otp', { method: 'POST', body: JSON.stringify({ destination, destinationKind: 'email', transport: 'email' }) });
}

export function verifyAccountEmailOtp(destination: string, code: string): Promise<ApiResult<AccountVerifyResponse>> {
  return request<AccountVerifyResponse>('/account/verify-otp', { method: 'POST', body: JSON.stringify({ destination, code }) });
}

export function getLoginDestinations(identifier: string): Promise<ApiResult<{ destinations: LoginDestination[] }>> {
  return request<{ destinations: LoginDestination[] }>('/auth/destinations', { method: 'POST', body: JSON.stringify({ identifier }) });
}

export function requestLoginOtp(identifier: string, destinationKind: OtpDestinationKind): Promise<ApiResult<RequestOtpResponse>> {
  return request<RequestOtpResponse>('/auth/request-otp', { method: 'POST', body: JSON.stringify({ identifier, destinationKind, transport: 'email' }) });
}

export function verifyLoginOtp(identifier: string, code: string): Promise<ApiResult<LoginResponse>> {
  return request<LoginResponse>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, code }) });
}

/** Perfil de la sesión guardada; 401 si el token ya no sirve. */
export function getMe(): Promise<ApiResult<MeResponse>> {
  return request<MeResponse>('/account/me');
}

/**
 * ¿Está libre esta identificación / este correo? Va por POST para no dejar
 * cédulas ni correos en la URL (y por tanto en los registros de acceso).
 */
export function checkAvailability(
  input: { identificationType: IdentificationType; identificationNumber: string } | { email: string },
): Promise<ApiResult<AvailabilityResponse>> {
  return request<AvailabilityResponse>('/register/check-availability', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
