# Porcia — App

Frontend web de **PorcIA**, el asistente porcícola colombiano de conocimiento
por voz. Este repo implementa **únicamente el wizard de registro** de
usuarios y fincas (dueño/administrador o trabajador) más un perfil de solo
lectura post-registro. No hay dashboard ni ninguna otra pantalla todavía —
ver `CLAUDE.md` para el alcance completo y las decisiones de diseño.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript `strict`.
- Validación con [zod](https://zod.dev/), espejo de las reglas del backend.
- Sin librerías de UI/CSS externas: los componentes (`Button`, `Input`,
  `PillGroup`, etc.) y los tokens de marca viven en `src/`.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # ajusta VITE_API_BASE_URL si tu backend no corre en localhost:3000
npm run dev             # http://localhost:5173
```

Otros scripts:

```bash
npm run build       # tsc -b && vite build
npm run preview      # sirve el build de producción localmente
npm run typecheck   # tsc -b --noEmit
npm run lint         # eslint .
npm run format       # prettier --write .
```

## Variables de entorno

| Variable              | Descripción                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | Base del backend de PorcIA. En local: `http://localhost:3000` (rutas `/register/*`). En producción: el dominio de Vercel del backend con prefijo `/api`. |

Ver `.env.example`.

## Flujo del wizard

Paso 0 (rol) → 1 (cuenta) → 2 (verificación OTP, con selector de transporte
WhatsApp/SMS/Telegram/Correo) → 3 (registro de finca, o búsqueda de finca
para trabajadores) → 4 (invitar equipo, opcional, solo dueño) → 5 (éxito) →
6 (perfil de solo lectura). El diseño de referencia está en
`design/Registro.dc.html`; el detalle funcional en
`../backend/specs/001-register-farm-and-user.md`.

## Subproyectos de Porcia

| Repositorio                                                  | Rol                                     |
| ------------------------------------------------------------ | ---------------------------------------- |
| [porcia-backend](https://github.com/esyepesv/porcia-backend) | API y bot de WhatsApp/Telegram con RAG  |
| [porcia-web](https://github.com/esyepesv/porcia-web)         | Página pública / landing                 |
| **porcia-app** (este repo)                                    | Wizard web de registro de usuarios/fincas |
