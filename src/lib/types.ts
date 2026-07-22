// Tipos compartidos del wizard de registro y del contrato con el backend.
// Nombres de campos en inglés (convención de código); copy visible en español.

export type Role = 'owner' | 'worker';
export type IdentificationType = 'CC' | 'CE' | 'PA';
export type LegalType = 'natural' | 'juridica';
export type TaxIdType = 'cedula' | 'nit';
export type Channel = 'whatsapp' | 'telegram';
export type MembershipStatus = 'activo' | 'pendiente';

/** Transportes de envío del código OTP (paso 2). Superconjunto de `Channel`:
 * el backend puede ofrecer también SMS y correo además de los canales de chat. */
export type OtpTransport = 'whatsapp' | 'telegram' | 'sms' | 'email';
export type OtpDestinationKind = 'phone' | 'email';

export interface AccountFormState {
  identificationType: IdentificationType;
  identificationNumber: string;
  phone: string;
  email: string;
}

export interface FarmFormState {
  name: string;
  legalType: LegalType;
  taxId: string;
  location: string;
  cebaCapacity: string;
  breedingCapacity: string;
  totalCapacity: string;
  sanitaryRegistry: string;
}

export interface WorkerDraft {
  id: string;
  displayName: string;
  identificationNumber: string;
  phone: string;
}

export interface FarmSearchResult {
  id: string;
  name: string;
  location: string;
  adminName: string;
}

export interface FieldErrors {
  [field: string]: string | undefined;
}

// --- Contrato HTTP con el backend (spec 001 / 004) ---

export interface OtpTransportsResponse {
  transports: OtpTransport[];
}

export interface RequestOtpResponse {
  ok: true;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyOtpResponse {
  ok: true;
  verified: boolean;
  destinationKind: OtpDestinationKind;
}

export interface FarmSearchResponse {
  results: FarmSearchResult[];
}

export interface RegisterUserPayload {
  identificationType: IdentificationType;
  identificationNumber: string;
  phone: string;
  channel: Channel;
  email?: string;
  displayName?: string;
}

export interface RegisterFarmPayload {
  name: string;
  legalType: LegalType;
  taxIdType: TaxIdType;
  taxId: string;
  location: string;
  cebaCapacity: number;
  breedingCapacity: number;
  totalCapacity: number;
  sanitaryRegistry: string;
}

export interface RegisterWorkerPayload {
  displayName: string;
  identificationNumber: string;
  phone: string;
}

export interface RegisterPayload {
  kind: Role;
  user: RegisterUserPayload;
  farm?: RegisterFarmPayload;
  farmId?: string;
  workers?: RegisterWorkerPayload[];
}

export interface RegisterResponse {
  farmId?: string;
  operatorId: string;
  membershipStatus: MembershipStatus;
  session: {
    token: string;
    expiresInSeconds: number;
  };
}
