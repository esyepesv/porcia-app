# CLAUDE.md — porcia-app

## Qué es este proyecto

Frontend web de **PorcIA** (asistente porcícola colombiano). **Alcance actual: splash + bienvenida de entrada, y el flujo de registro de usuarios y granjas** — pantalla de marca, hub de bienvenida (iniciar sesión / registrarme), un wizard multi-paso más un perfil de solo lectura. NO hay dashboard, ni gestión de granja, ni ninguna otra pantalla todavía; no las agregues sin spec aprobado.

## Fuente de la verdad

- **Entrada:** `pages/SplashPage.tsx` (marca, pasa sola a bienvenida) → `pages/WelcomePage.tsx` (hub: "Registrarme" entra al wizard, "Ya tengo cuenta" entra a `LoginPage`). Ver `backend/specs/012-web-entry-splash-bienvenida.md`.
- **Sesión y navegación:** `backend/specs/013-endurecimiento-registro-y-sesion.md`. Al arrancar, si hay token en `localStorage` se consulta `/account/me` y se restaura el perfil (si el token no sirve, se descarta y sigue el arranque normal). Hay cerrar sesión, todas las pantallas tienen salida, y el botón atrás del navegador —y el físico de Android— retrocede un paso: la vista se guarda en `history.state` y se aplica en `popstate`, **sin router**; éxito y perfil usan `replaceState` para no volver a un formulario ya enviado.
- **Diseño:** `design/Registro.dc.html` + design system en `design/ds/`. El wizard es: rol → cuenta → finca/búsqueda → equipo opcional → éxito → perfil. El OTP es opcional y posterior para verificar correo o iniciar sesión.
- **Spec funcional:** `backend/specs/001-register-farm-and-user.md` (repo porcia-backend, en el mismo monorepo local `../backend/`). Ahí están los campos, las reglas y el manejo de errores. El flujo spec-first manda: nada se implementa sin spec aprobado.
- **Diferencia deliberada con el diseño:** los botones "Editar" del perfil (paso 6) NO se implementan en v1 — el perfil es solo lectura (ver spec 001, "NO incluye v1").

## Stack y estructura

- Vite + React 18 + TypeScript `strict`. Deploy en Vercel (proyecto separado del backend).
- Validación con zod, espejando los enums/formatos del backend: tipo de identificación `TI|CC|CE|PPT|PEP|PA`, tipo de persona `natural|juridica`, celular colombiano (10 dígitos, empieza por 3), capacidades numéricas positivas.
- `VITE_API_BASE_URL` apunta al backend: en local `http://localhost:3000` (rutas `/register/*`), en producción el dominio de Vercel del backend (rutas `/api/register/*`). Nunca hardcodear la base.
- Sesión: el JWT que devuelve `POST /register` se guarda en `localStorage` y se envía como `Authorization: Bearer`.

## Contrato con el backend (spec 004)

El OTP es **multi-transporte**: WhatsApp, Telegram, SMS (Twilio) y correo (SMTP). La llave de la verificación es el **destino** (celular en E.164 o correo en minúsculas), no el transporte.

- `GET /register/otp-transports` → `200 {transports: ('whatsapp'|'telegram'|'sms'|'email')[]}` — solo los que tengan credenciales configuradas
- `POST /register/request-otp` `{destination, destinationKind:'phone'|'email', transport}` → `200 {ok, expiresInSeconds, resendAfterSeconds}` | `429 rate_limited` | `503 channel_not_configured` | `502 send_failed`
- `POST /register/verify-otp` `{destination, code}` → `200 {ok, verified, destinationKind}` | `400 invalid_code` | `410 expired_code` | `429 too_many_attempts` | `404 not_found`
- `GET /register/farms/search?q=` → `200 {results: [{id, name, location, adminName}]}` (máx. 5)
- `POST /register/check-availability` `{identificationType, identificationNumber}` **o** `{email}` → `200 {available}`. Se consulta al SALIR del campo (no en cada tecla) para avisar de un duplicado antes de llenar tres pasos. Es comodidad: la defensa real es el `409` del registro.
- `POST /register` `{kind:'owner'|'worker', user, farm?, farmId?, workers?}` → `201 {farmId?, operatorId, membershipStatus, session:{token, expiresInSeconds}}` | `409 duplicate_identification|duplicate_email|duplicate_farm|already_member` | `404 farm_not_found` | `400 validation`
- `POST /account/request-otp` y `/account/verify-otp` verifican destinos de una sesión; `POST /auth/destinations|request-otp|verify-otp` soportan login por correo/cédula.
- **`GET /account/me`** → `200 {user:{id, identificationType, identificationNumber, email, displayName?, emailVerified, phoneVerified}, farms:[{farmId, name, legalType, taxIdType, taxId, location, cebaCapacity, breedingCapacity, totalCapacity, sanitaryRegistry, role, membershipStatus}]}` | `401 unauthorized`. De ahí salen los datos del perfil al recargar la página y al iniciar sesión. **No trae el celular**: el backend solo guarda su HMAC, así que el perfil indica que está guardado en vez de mostrarlo.
- **Segunda finca (multi-granja):** se reenvía `POST /register` con el mismo bloque `user` y una finca distinta. Ojo: desde la web eso ahora responde `duplicate_identification` salvo que la persona pruebe ser la titular (regla de "misma persona", spec 013 §4.1) — el camino natural es hacerlo con sesión iniciada.

### Cómo se leen los errores (no romper esto)

El backend responde **`{ error: { code, message } }`** — `error` es un OBJETO. Hay que leer `error.code` **anidado** y preferir su `message`, que ya viene en español con el tono de marca. Leerlo como si `error` fuera un string fue un defecto real: convertía TODOS los errores en genéricos ("Algo salió mal de nuestro lado") y hacía parecer que el backend no validaba duplicados. Un duplicado debe además devolver al paso y campo culpables, no dejar solo un aviso al final.

## Marca (ver design/ds/readme.md — es la guía completa)

- Paleta: teal `#1B4D3E` (primario/confianza), terracota `#C86446` (CTA/acentos), crema `#F4EFEA` (fondo), ink `#2C3531` (texto). Usar las CSS custom properties de `design/ds/tokens/`.
- Tipografía: **Fredoka** (títulos/display) + **Inter** (cuerpo y botones). Ojo: el manual de marca viejo decía Barlow; el sitio real usa Fredoka — seguir Fredoka.
- Radios generosos (12–24px, píldoras 999px), sombras suaves tintadas, sin librerías de iconos (los iconos son primitivas CSS), animación mínima y con `prefers-reduced-motion`.
- Copy en español colombiano, tuteo, honesto sobre limitaciones.

## Reglas

- Este repo es independiente del backend: no importar código de `../backend`, solo consumir su API HTTP.
- No agregar rutas/pantallas fuera del wizard sin spec aprobado.
- El código de prueba `123456` que aparece en el diseño es SOLO del mock de diseño — jamás implementar códigos OTP hardcodeados.
- **Hace falta un `.env.local`** con `VITE_API_BASE_URL` (en local `http://localhost:3000`): `getBaseUrl()` lo lee sin defecto, así que sin ese archivo cualquier llamada revienta. `.env.example` NO lo carga Vite.
- **Accesibilidad y contraste:** no volver a usar `--accent` como fondo de texto blanco (da ~3.9:1); para eso está `--accent-cta`. `--text-muted` ya está al nivel de `--text-body` porque el valor anterior fallaba AA. Los botones-texto (`.pia-link-btn`) llevan 44px de alto mínimo.
