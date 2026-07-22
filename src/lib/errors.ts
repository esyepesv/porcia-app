import type { ApiError } from './api';

/** Traduce un error del backend a un mensaje en español, tono cercano de marca. */
export function toUserMessage(error: ApiError): string {
  if (error.kind === 'network') {
    return 'No pudimos conectarnos con PorcIA. Revisa tu conexión e inténtalo de nuevo.';
  }

  if (error.kind === 'unknown') {
    return 'Algo salió mal de nuestro lado. Inténtalo de nuevo en un momento.';
  }

  switch (error.code) {
    case 'rate_limited':
      return 'Pediste demasiados códigos seguidos. Espera un momento y vuelve a intentar.';
    case 'channel_not_configured':
      return 'Ese medio no está disponible ahora mismo. Prueba con otro.';
    case 'send_failed':
      return 'No pudimos enviarte el código. Intenta de nuevo o prueba por otro medio.';
    case 'invalid_code':
      return 'Código incorrecto. Verifica los 6 dígitos.';
    case 'expired_code':
      return 'El código venció. Pide uno nuevo.';
    case 'too_many_attempts':
      return 'Demasiados intentos. Pide un código nuevo.';
    case 'not_found':
      return 'Ese código ya no es válido. Pide uno nuevo.';
    case 'duplicate_identification':
      return 'Ya existe una cuenta con esa identificación.';
    case 'duplicate_farm':
      return 'Esa finca ya está registrada en tu cuenta.';
    case 'already_member':
      return 'Ya tienes una solicitud o membresía en esa finca.';
    case 'phone_not_verified':
      return 'Necesitamos verificar tu celular de nuevo antes de continuar.';
    case 'validation':
      return 'Revisa los datos: alguno no es válido.';
    case 'farm_not_found':
      return 'No encontramos esa finca. Verifica con tu administrador el nombre exacto.';
    default:
      return 'Algo salió mal. Inténtalo de nuevo.';
  }
}
