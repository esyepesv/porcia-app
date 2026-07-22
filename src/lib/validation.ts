import { z } from 'zod';

// Validaciones espejo de las reglas del backend (spec 001).
// Los mensajes de error se muestran tal cual bajo cada campo.

export const identificationTypeSchema = z.enum(['CC', 'CE', 'PA']);
export const legalTypeSchema = z.enum(['natural', 'juridica']);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^3\d{9}$/, 'Ingresa un celular colombiano válido (10 dígitos).');

export const identificationNumberSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa un número de identificación válido.');

const emailSchema = z.string().trim().email('Ingresa un correo electrónico válido.');

export interface AccountInput {
  identificationNumber: string;
  phone: string;
  email: string;
}

export function validateAccount(input: AccountInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const idResult = identificationNumberSchema.safeParse(input.identificationNumber);
  if (!idResult.success) {
    errors.identificationNumber = idResult.error.issues[0]?.message ?? 'Dato inválido.';
  }

  const phoneResult = phoneSchema.safeParse(input.phone);
  if (!phoneResult.success) {
    errors.phone = phoneResult.error.issues[0]?.message ?? 'Dato inválido.';
  }

  const emailResult = emailSchema.safeParse(input.email);
  if (!emailResult.success) {
    errors.email = input.email.trim().length === 0
      ? 'Necesito tu correo electrónico.'
      : 'Ese correo no parece válido. Revísalo, por favor.';
  }

  return errors;
}

export interface FarmInput {
  name: string;
  taxId: string;
  location: string;
  cebaCapacity: string;
  breedingCapacity: string;
  totalCapacity: string;
  sanitaryRegistry: string;
}

const nonNegativeIntSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa un número.')
  .refine((v) => /^\d+$/.test(v), 'Ingresa un número entero mayor o igual a 0.');

export function validateFarm(input: FarmInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) errors.name = 'Ingresa el nombre de la finca.';
  if (!input.taxId.trim()) errors.taxId = 'Ingresa un número de identificación válido.';
  if (!input.location.trim()) errors.location = 'Ingresa la ubicación de la finca.';
  if (!input.sanitaryRegistry.trim()) {
    errors.sanitaryRegistry = 'Ingresa el registro sanitario ICA.';
  }

  const cebaResult = nonNegativeIntSchema.safeParse(input.cebaCapacity);
  if (!cebaResult.success) {
    errors.cebaCapacity = cebaResult.error.issues[0]?.message ?? 'Dato inválido.';
  }
  const breedingResult = nonNegativeIntSchema.safeParse(input.breedingCapacity);
  if (!breedingResult.success) {
    errors.breedingCapacity = breedingResult.error.issues[0]?.message ?? 'Dato inválido.';
  }
  const totalResult = nonNegativeIntSchema.safeParse(input.totalCapacity);
  if (!totalResult.success) {
    errors.totalCapacity = totalResult.error.issues[0]?.message ?? 'Dato inválido.';
  }

  return errors;
}

export interface WorkerInput {
  displayName: string;
  identificationNumber: string;
  phone: string;
}

export function validateWorker(input: WorkerInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.displayName.trim()) errors.displayName = 'Ingresa el nombre del trabajador.';

  const idResult = identificationNumberSchema.safeParse(input.identificationNumber);
  if (!idResult.success) {
    errors.identificationNumber = idResult.error.issues[0]?.message ?? 'Dato inválido.';
  }

  const phoneResult = phoneSchema.safeParse(input.phone);
  if (!phoneResult.success) {
    errors.phone = phoneResult.error.issues[0]?.message ?? 'Dato inválido.';
  }

  return errors;
}

/** Filtra dígitos y corta a 10 caracteres, como el input de celular del diseño. */
export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

/** Filtra a solo dígitos, sin cortar longitud (identificaciones, capacidades). */
export function sanitizeDigitsInput(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Formatea un celular colombiano de 10 dígitos para mostrarlo: "300 123 4567". */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** Normaliza un celular colombiano de 10 dígitos a E.164 (+57...) para enviarlo como `destination`. */
export function toE164Phone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `+57${digits}`;
}
