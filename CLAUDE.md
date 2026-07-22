# CLAUDE.md — porcia-app

## Qué es este proyecto

Frontend web de **PorcIA** (asistente porcícola colombiano). **Alcance actual: SOLO el flujo de registro de usuarios y granjas** — un wizard multi-paso más un perfil de solo lectura. NO hay dashboard, ni gestión de granja, ni ninguna otra pantalla todavía; no las agregues sin spec aprobado.

## Fuente de la verdad

- **Diseño:** `design/Registro.dc.html` + design system en `design/ds/` (tokens y guía importados del proyecto Claude Design "Porcia app registro usuarios y granjas"). El wizard React debe reproducir ese diseño fielmente: paso 0 rol (dueño/trabajador) → paso 1 cuenta → paso 2 OTP 6 dígitos → paso 3 finca (dueño) o búsqueda de finca (trabajador) → paso 4 invitar equipo (dueño, opcional) → éxito → perfil.
- **Spec funcional:** `backend/specs/001-register-farm-and-user.md` (repo porcia-backend, en el mismo monorepo local `../backend/`). Ahí están los campos, las reglas y el manejo de errores. El flujo spec-first manda: nada se implementa sin spec aprobado.
- **Diferencia deliberada con el diseño:** los botones "Editar" del perfil (paso 6) NO se implementan en v1 — el perfil es solo lectura (ver spec 001, "NO incluye v1").

## Stack y estructura

- Vite + React 18 + TypeScript `strict`. Deploy en Vercel (proyecto separado del backend).
- Validación con zod, espejando los enums/formatos del backend: tipo de identificación `CC|CE|PA`, tipo de persona `natural|juridica`, celular colombiano (10 dígitos, empieza por 3), capacidades numéricas positivas.
- `VITE_API_BASE_URL` apunta al backend: en local `http://localhost:3000` (rutas `/register/*`), en producción el dominio de Vercel del backend (rutas `/api/register/*`). Nunca hardcodear la base.
- Sesión: el JWT que devuelve `POST /register` se guarda en `localStorage` y se envía como `Authorization: Bearer`.

## Contrato con el backend (spec 004)

El OTP es **multi-transporte**: WhatsApp, Telegram, SMS (Twilio) y correo (SMTP). La llave de la verificación es el **destino** (celular en E.164 o correo en minúsculas), no el transporte.

- `GET /register/otp-transports` → `200 {transports: ('whatsapp'|'telegram'|'sms'|'email')[]}` — solo los que tengan credenciales configuradas
- `POST /register/request-otp` `{destination, destinationKind:'phone'|'email', transport}` → `200 {ok, expiresInSeconds, resendAfterSeconds}` | `429 rate_limited` | `503 channel_not_configured` | `502 send_failed`
- `POST /register/verify-otp` `{destination, code}` → `200 {ok, verified, destinationKind}` | `400 invalid_code` | `410 expired_code` | `429 too_many_attempts` | `404 not_found`
- `GET /register/farms/search?q=` → `200 {results: [{id, name, location, adminName}]}` (máx. 5)
- `POST /register` `{kind:'owner'|'worker', user, farm?, farmId?, workers?}` → `201 {farmId?, operatorId, membershipStatus, session:{token, expiresInSeconds}}` | `409 duplicate_identification|duplicate_farm|already_member` | `412 phone_not_verified` | `404 farm_not_found` | `400 validation`
- **Segunda finca (multi-granja):** se reenvía `POST /register` con el mismo bloque `user` y una finca distinta. El backend reconoce a la persona por su identificación y, si el destino sigue verificado dentro de la ventana de gracia, agrega la finca en vez de responder `duplicate_identification`. Si la ventana venció, hay que repetir el OTP.
- Todos los errores se mapean a mensajes en español claros para el usuario (tono de marca: cercano, de "tú", sin tecnicismos).

Verificar el **correo** también habilita el registro. Pero si solo se verificó el correo, el backend no liga la identidad de WhatsApp: esa persona no será reconocida al escribirle al bot hasta que verifique su celular. No prometas en la interfaz que ya puede usar WhatsApp si solo verificó el correo.

## Marca (ver design/ds/readme.md — es la guía completa)

- Paleta: teal `#1B4D3E` (primario/confianza), terracota `#C86446` (CTA/acentos), crema `#F4EFEA` (fondo), ink `#2C3531` (texto). Usar las CSS custom properties de `design/ds/tokens/`.
- Tipografía: **Fredoka** (títulos/display) + **Inter** (cuerpo y botones). Ojo: el manual de marca viejo decía Barlow; el sitio real usa Fredoka — seguir Fredoka.
- Radios generosos (12–24px, píldoras 999px), sombras suaves tintadas, sin librerías de iconos (los iconos son primitivas CSS), animación mínima y con `prefers-reduced-motion`.
- Copy en español colombiano, tuteo, honesto sobre limitaciones.

## Reglas

- Este repo es independiente del backend: no importar código de `../backend`, solo consumir su API HTTP.
- No agregar rutas/pantallas fuera del wizard sin spec aprobado.
- El código de prueba `123456` que aparece en el diseño es SOLO del mock de diseño — jamás implementar códigos OTP hardcodeados.
