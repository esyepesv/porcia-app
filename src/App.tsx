import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { usePostHog } from '@posthog/react';
import {
  checkAvailability,
  clearToken,
  getMe,
  getOtpTransports,
  getStoredToken,
  requestOtp,
  searchFarms,
  storeToken,
  submitRegistration,
  verifyOtp,
  requestAccountEmailOtp,
  verifyAccountEmailOtp,
  getLoginDestinations,
  requestLoginOtp,
  verifyLoginOtp,
  type ApiError,
} from './lib/api';
import { toUserMessage } from './lib/errors';
import type {
  AccountFormState,
  Channel,
  FarmFormState,
  FarmSearchResult,
  FieldErrors,
  MembershipStatus,
  MeResponse,
  OtpDestinationKind,
  OtpTransport,
  RegisterFarmPayload,
  RegisterResponse,
  RegisterUserPayload,
  Role,
  WorkerDraft,
} from './lib/types';
import {
  formatPhoneDisplay,
  toE164Phone,
  validateAccount,
  validateFarm,
  validateWorker,
} from './lib/validation';

import { Button } from './components/Button';
import { Card } from './components/Card';
import { ErrorBanner } from './components/ErrorBanner';
import { StepHeader } from './components/StepHeader';

import { AccountPage } from './pages/AccountPage';
import { FarmPage } from './pages/FarmPage';
import { FarmSearchPage } from './pages/FarmSearchPage';
import { OtpPage } from './pages/OtpPage';
import { ProfilePage } from './pages/ProfilePage';
import { RolePage } from './pages/RolePage';
import { SuccessPage } from './pages/SuccessPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { LoginPage } from './pages/LoginPage';
import { TeamPage } from './pages/TeamPage';
import { SplashPage } from './pages/SplashPage';
import { WelcomePage } from './pages/WelcomePage';

// La pantalla OTP se reutiliza en la verificación posterior al registro
// (siguiente iteración); el wizard ya no la muestra como paso obligatorio.
void OtpPage;

const ID_LABELS: Record<AccountFormState['identificationType'], string> = {
  TI: 'Tarjeta de Identidad',
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PPT: 'Permiso por Protección Temporal',
  PEP: 'Permiso Especial de Permanencia',
  PA: 'Pasaporte',
};

const TRANSPORT_LABELS: Record<OtpTransport, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  telegram: 'Telegram',
  email: 'Correo',
};

const TRANSPORT_ORDER: OtpTransport[] = ['whatsapp', 'sms', 'telegram', 'email'];

const INITIAL_ACCOUNT: AccountFormState = {
  identificationType: 'CC',
  identificationNumber: '',
  phone: '',
  email: '',
};

const INITIAL_FARM: FarmFormState = {
  name: '',
  legalType: 'natural',
  taxId: '',
  location: '',
  cebaCapacity: '',
  breedingCapacity: '',
  totalCapacity: '',
  sanitaryRegistry: '',
};

interface UiState {
  step: number;
  role: Role | null;
  account: AccountFormState;
  accountErrors: FieldErrors;
  otpDigits: string[];
  otpTransports: OtpTransport[];
  selectedTransport: OtpTransport | null;
  otpError?: string;
  emailNote: boolean;
  resendTimer: number;
  farm: FarmFormState;
  farmErrors: FieldErrors;
  workers: WorkerDraft[];
  workerErrors: Record<string, FieldErrors>;
  farmSearchQuery: string;
  farmSearchResults: FarmSearchResult[];
  farmSearchDone: boolean;
  selectedFarm: FarmSearchResult | null;
  registerResult: RegisterResponse | null;
  loading: boolean;
  apiError?: string;
  screen?: 'splash' | 'welcome' | 'verifyEmail' | 'login';
  emailVerified: boolean;
  loginDestinations: import('./lib/types').LoginDestination[] | null;
  // Restaurando la sesión guardada al arrancar: evita el parpadeo del splash
  // antes de saber si hay que mostrar el perfil.
  restoring: boolean;
  // El perfil viene de /account/me tras recargar o iniciar sesión; el celular
  // no está disponible ahí (solo se guarda hasheado).
  phoneKnown: boolean;
  membershipStatus?: MembershipStatus;
}

const INITIAL_STATE: UiState = {
  step: 0,
  role: null,
  account: INITIAL_ACCOUNT,
  accountErrors: {},
  otpDigits: ['', '', '', '', '', ''],
  otpTransports: [],
  selectedTransport: null,
  otpError: undefined,
  emailNote: false,
  resendTimer: 0,
  farm: INITIAL_FARM,
  farmErrors: {},
  workers: [],
  workerErrors: {},
  farmSearchQuery: '',
  farmSearchResults: [],
  farmSearchDone: false,
  selectedFarm: null,
  registerResult: null,
  loading: false,
  apiError: undefined,
  screen: 'splash',
  emailVerified: false,
  loginDestinations: null,
  restoring: getStoredToken() !== null,
  phoneKnown: true,
};

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <Card>{children}</Card>
    </div>
  );
}

function totalStepsFor(role: Role | null): number {
  return role === 'worker' ? 2 : 3;
}

let workerUidCounter = 0;
function nextWorkerId(): string {
  workerUidCounter += 1;
  return `w${workerUidCounter}`;
}

/** Borra el error de los campos que la persona acaba de reescribir. */
function blankErrorsFor(fields: Partial<AccountFormState>): FieldErrors {
  return Object.fromEntries(Object.keys(fields).map((key) => [key, undefined]));
}

export function App() {
  const [state, setState] = useState<UiState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posthog = usePostHog();

  function patch(update: Partial<UiState> | ((s: UiState) => Partial<UiState>)): void {
    setState((prev) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
  }

  async function beginEmailVerification(): Promise<void> {
    patch({ loading: true, apiError: undefined });
    const result = await requestAccountEmailOtp(state.account.email);
    patch({ loading: false });
    if (result.ok) patch({ screen: 'verifyEmail' });
    else patch({ apiError: toUserMessage(result.error) });
  }
  async function verifyEmail(code: string): Promise<void> {
    patch({ loading: true, apiError: undefined });
    const result = await verifyAccountEmailOtp(state.account.email, code);
    patch({ loading: false });
    if (result.ok) patch({ emailVerified: true, screen: undefined, step: 5 });
    else patch({ apiError: toUserMessage(result.error) });
  }
  async function findLogin(identifier: string): Promise<void> {
    patch({ loading: true, apiError: undefined });
    const result = await getLoginDestinations(identifier);
    patch({
      loading: false,
      loginDestinations: result.ok ? result.data.destinations : null,
      apiError: result.ok ? undefined : toUserMessage(result.error),
    });
  }
  async function sendLogin(identifier: string, kind: OtpDestinationKind): Promise<void> {
    patch({ loading: true, apiError: undefined });
    const result = await requestLoginOtp(identifier, kind);
    patch({ loading: false, apiError: result.ok ? undefined : toUserMessage(result.error) });
  }
  async function login(identifier: string, code: string): Promise<void> {
    patch({ loading: true, apiError: undefined });
    const result = await verifyLoginOtp(identifier, code);
    if (!result.ok) {
      patch({ loading: false, apiError: toUserMessage(result.error) });
      return;
    }
    storeToken(result.data.session.token);
    // Sin este paso el perfil salía EN BLANCO: se saltaba al paso 5 con el
    // estado del wizard vacío (role null incluido), así que no se pintaba nada.
    const me = await getMe();
    patch({ loading: false });
    if (me.ok) {
      applyProfile(me.data);
    } else {
      patch({ apiError: toUserMessage(me.error) });
    }
  }

  /** Vuelca el perfil del servidor en el estado y aterriza en la pantalla de perfil. */
  function applyProfile(me: MeResponse): void {
    const farm = me.farms[0];
    const isOwner = farm?.role === 'administrador_dueno';
    patch({
      screen: undefined,
      step: 5,
      role: isOwner ? 'owner' : 'worker',
      apiError: undefined,
      restoring: false,
      emailVerified: me.user.emailVerified,
      phoneKnown: false,
      membershipStatus: farm?.membershipStatus,
      account: {
        identificationType: me.user.identificationType,
        identificationNumber: me.user.identificationNumber,
        phone: '',
        email: me.user.email,
      },
      selectedFarm: farm && !isOwner ? { id: farm.farmId, name: farm.name, location: farm.location, adminName: '' } : null,
      farm: farm
        ? {
            name: farm.name,
            legalType: farm.legalType,
            taxId: farm.taxId,
            location: farm.location,
            cebaCapacity: String(farm.cebaCapacity),
            breedingCapacity: String(farm.breedingCapacity),
            totalCapacity: String(farm.totalCapacity),
            sanitaryRegistry: farm.sanitaryRegistry,
          }
        : INITIAL_FARM,
    });
  }

  /**
   * Aviso temprano de duplicado al salir del campo. Es comodidad, no la
   * defensa: quien manda es la comprobación del servidor al registrar.
   */
  async function checkFieldAvailability(field: 'identificationNumber' | 'email'): Promise<void> {
    const value =
      field === 'email' ? state.account.email.trim() : state.account.identificationNumber.trim();
    if (value.length === 0) return;
    if (field === 'email' && !value.includes('@')) return;

    const result = await checkAvailability(
      field === 'email'
        ? { email: value }
        : {
            identificationType: state.account.identificationType,
            identificationNumber: value,
          },
    );
    if (!result.ok || result.data.available) return;
    patch((s) => ({
      accountErrors: {
        ...s.accountErrors,
        [field]:
          field === 'email'
            ? 'Ya existe una cuenta con ese correo. Si es tuya, inicia sesión.'
            : 'Ya existe una cuenta con ese documento. Si es tuya, inicia sesión.',
      },
    }));
  }

  function logout(): void {
    clearToken();
    setState({ ...INITIAL_STATE, screen: 'welcome', restoring: false });
  }

  function stopResendTimer(): void {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startResendTimer(seconds: number): void {
    stopResendTimer();
    patch({ resendTimer: seconds });
    timerRef.current = setInterval(() => {
      setState((prev) => {
        const next = prev.resendTimer - 1;
        if (next <= 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return { ...prev, resendTimer: Math.max(next, 0) };
      });
    }, 1000);
  }

  useEffect(() => stopResendTimer, []);

  // Sesión guardada: al arrancar se trae el perfil real del servidor. Antes
  // el token se guardaba pero nadie lo leía, así que recargar la página
  // devolvía a la pantalla inicial como si nunca se hubiera entrado.
  useEffect(() => {
    if (getStoredToken() === null) return;
    let cancelled = false;
    void (async () => {
      const me = await getMe();
      if (cancelled) return;
      if (me.ok) {
        applyProfile(me.data);
        return;
      }
      // Token vencido o inválido: se descarta y se sigue el arranque normal.
      clearToken();
      patch({ restoring: false });
    })();
    return () => {
      cancelled = true;
    };
    // Solo al montar: es la restauración inicial de la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Splash de marca: pasa sola a bienvenida tras un momento breve.
  useEffect(() => {
    if (state.screen !== 'splash' || state.restoring) return;
    const handle = setTimeout(() => patch({ screen: 'welcome' }), 1100);
    return () => clearTimeout(handle);
  }, [state.screen, state.restoring]);

  // ── Historial del navegador ────────────────────────────────────────────
  // La app es una sola página con máquina de estados, sin rutas. Sin esto el
  // botón "atrás" (y el botón físico de Android) sacaba del sitio en vez de
  // retroceder un paso. Se guarda la vista en `history.state` y se aplica de
  // vuelta al recibir `popstate`, sin necesidad de un router.
  const poppingRef = useRef(false);

  useEffect(() => {
    function onPopState(event: PopStateEvent): void {
      const view = (event.state as { view?: string } | null)?.view;
      if (view === undefined) return;
      poppingRef.current = true;
      if (view.startsWith('step:')) {
        patch({ screen: undefined, step: Number(view.slice(5)), apiError: undefined });
      } else {
        patch({ screen: view as UiState['screen'], apiError: undefined });
      }
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const currentView = state.screen ?? `step:${state.step}`;
  useEffect(() => {
    if (poppingRef.current) {
      poppingRef.current = false;
      return;
    }
    const previous = (window.history.state as { view?: string } | null)?.view;
    if (previous === currentView) return;
    // Éxito y perfil son finales: se reemplaza en vez de apilar para que
    // "atrás" no devuelva al formulario de un registro ya completado.
    const terminal = state.step >= 4 && state.screen === undefined;
    if (previous === undefined || terminal) {
      window.history.replaceState({ view: currentView }, '');
    } else {
      window.history.pushState({ view: currentView }, '');
    }
  }, [currentView, state.step, state.screen]);

  // Búsqueda de finca (trabajador, paso 3), con debounce de 300ms.
  useEffect(() => {
    if (!(state.step === 2 && state.role === 'worker')) return;
    const query = state.farmSearchQuery.trim();
    if (!query) {
      patch({ farmSearchResults: [], farmSearchDone: false });
      return;
    }
    const handle = setTimeout(() => {
      void (async () => {
        const result = await searchFarms(query);
        if (result.ok) {
          patch({ farmSearchResults: result.data.results, farmSearchDone: true });
        } else {
          patch({
            farmSearchResults: [],
            farmSearchDone: true,
            apiError: toUserMessage(result.error),
          });
        }
      })();
    }, 300);
    return () => clearTimeout(handle);
  }, [state.farmSearchQuery, state.step, state.role]);

  function pickDefaultTransport(available: OtpTransport[], hasEmail: boolean): OtpTransport | null {
    for (const t of TRANSPORT_ORDER) {
      if (available.includes(t) && (t !== 'email' || hasEmail)) return t;
    }
    return null;
  }

  function destinationFor(transport: OtpTransport): {
    destination: string;
    destinationKind: OtpDestinationKind;
  } {
    if (transport === 'email') {
      return { destination: state.account.email.trim(), destinationKind: 'email' };
    }
    return { destination: toE164Phone(state.account.phone), destinationKind: 'phone' };
  }

  async function doRequestOtp(transport: OtpTransport): Promise<void> {
    patch({ loading: true, apiError: undefined, otpError: undefined });
    const { destination, destinationKind } = destinationFor(transport);
    const result = await requestOtp(destination, destinationKind, transport);
    patch({ loading: false });
    if (result.ok) {
      patch({
        selectedTransport: transport,
        otpDigits: ['', '', '', '', '', ''],
        otpError: undefined,
        emailNote: false,
      });
      startResendTimer(result.data.resendAfterSeconds || 30);
    } else {
      patch({ apiError: toUserMessage(result.error) });
    }
  }

  async function enterOtpStep(): Promise<void> {
    patch({
      step: 2,
      otpDigits: ['', '', '', '', '', ''],
      otpError: undefined,
      emailNote: false,
      apiError: undefined,
    });
    const transportsResult = await getOtpTransports();
    const transports =
      transportsResult.ok && transportsResult.data.transports.length > 0
        ? transportsResult.data.transports
        : (['whatsapp'] as OtpTransport[]);
    patch({ otpTransports: transports });

    const hasEmail = state.account.email.trim().length > 0;
    const defaultTransport = pickDefaultTransport(transports, hasEmail);
    if (defaultTransport) {
      await doRequestOtp(defaultTransport);
    } else {
      patch({
        apiError:
          'No pudimos encontrar un medio disponible para enviarte el código. Agrega un correo en el paso anterior o inténtalo más tarde.',
      });
    }
  }

  function handleSelectTransport(transport: OtpTransport): void {
    if (transport === 'email' && state.account.email.trim().length === 0) {
      patch({ emailNote: true });
      return;
    }
    patch({ emailNote: false });
    if (transport !== state.selectedTransport) {
      posthog?.capture('registration_otp_transport_selected', { transport });
      void doRequestOtp(transport);
    }
  }

  function handleResend(): void {
    if (state.resendTimer > 0) return;
    posthog?.capture('registration_otp_resent', { transport: state.selectedTransport });
    void doRequestOtp(state.selectedTransport ?? 'whatsapp');
  }

  async function handleVerifyOtp(): Promise<void> {
    const code = state.otpDigits.join('');
    if (code.length !== 6) {
      patch({ otpError: 'Ingresa los 6 dígitos.' });
      return;
    }
    if (!state.selectedTransport) return;
    patch({ loading: true, otpError: undefined });
    const { destination } = destinationFor(state.selectedTransport);
    const result = await verifyOtp(destination, code);
    patch({ loading: false });
    if (result.ok) {
      if (result.data.verified) {
        stopResendTimer();
        posthog?.capture('registration_otp_verified', { transport: state.selectedTransport });
        patch({ step: 3, otpError: undefined });
      } else {
        posthog?.capture('registration_otp_failed', {
          transport: state.selectedTransport,
          reason: 'invalid_code',
        });
        patch({ otpError: 'Código incorrecto. Verifica los 6 dígitos.' });
      }
      return;
    }
    posthog?.capture('registration_otp_failed', {
      transport: state.selectedTransport,
      reason: result.error.kind === 'api' ? result.error.code : result.error.kind,
    });
    patch({ otpError: toUserMessage(result.error) });
  }

  function buildUserPayload(): RegisterUserPayload {
    const trimmedEmail = state.account.email.trim();
    const registerChannel: Channel =
      state.selectedTransport === 'telegram' ? 'telegram' : 'whatsapp';
    return {
      identificationType: state.account.identificationType,
      identificationNumber: state.account.identificationNumber.trim(),
      phone: toE164Phone(state.account.phone),
      channel: registerChannel,
      email: trimmedEmail,
    };
  }

  /**
   * Devuelve a la persona al paso donde está el dato que chocó, con el error
   * bajo el campo. Antes todo esto era invisible: el código del backend se
   * perdía al parsear la respuesta y solo salía "Algo salió mal".
   */
  function handleRegisterError(error: ApiError): void {
    posthog?.capture('registration_failed', {
      reason: error.kind === 'api' ? error.code : error.kind,
      role: state.role,
    });
    const message = toUserMessage(error);
    if (error.kind !== 'api') {
      patch({ apiError: message });
      return;
    }
    switch (error.code) {
      case 'duplicate_identification':
        patch({ step: 1, accountErrors: { identificationNumber: message }, apiError: message });
        return;
      case 'duplicate_email':
        patch({ step: 1, accountErrors: { email: message }, apiError: message });
        return;
      case 'duplicate_farm':
        patch({ step: 2, farmErrors: { name: message }, apiError: message });
        return;
      case 'already_member':
      case 'farm_not_found':
        patch({ step: 2, selectedFarm: null, apiError: message });
        return;
      case 'phone_not_verified':
        patch({ step: 1, accountErrors: { phone: message }, apiError: message });
        return;
      default:
        patch({ apiError: message });
    }
  }

  function handleContinueAccount(): void {
    const errors = validateAccount({
      identificationNumber: state.account.identificationNumber,
      phone: state.account.phone,
      email: state.account.email,
    });
    if (Object.keys(errors).length > 0) {
      patch({ accountErrors: errors });
      return;
    }
    posthog?.capture('registration_account_submitted', {
      has_email: state.account.email.trim().length > 0,
      identification_type: state.account.identificationType,
      role: state.role,
    });
    patch({ accountErrors: {} });
    patch({ accountErrors: {}, step: 2 });
  }

  function handleContinueFarm(): void {
    const errors = validateFarm(state.farm);
    if (Object.keys(errors).length > 0) {
      patch({ farmErrors: errors });
      return;
    }
    posthog?.capture('registration_farm_submitted', { legal_type: state.farm.legalType });
    patch({ farmErrors: {}, step: 3 });
  }

  async function handleSubmitWorkerRequest(): Promise<void> {
    if (!state.selectedFarm) return;
    patch({ loading: true, apiError: undefined });
    const result = await submitRegistration({
      kind: 'worker',
      user: buildUserPayload(),
      farmId: state.selectedFarm.id,
    });
    patch({ loading: false });
    if (result.ok) {
      storeToken(result.data.session.token);
      posthog?.identify(result.data.operatorId);
      posthog?.capture('registration_completed', {
        role: 'worker',
        membership_status: result.data.membershipStatus,
      });
      patch({ registerResult: result.data, step: 4 });
      return;
    }
    handleRegisterError(result.error);
  }

  async function handleFinishRegistration(): Promise<void> {
    const nonEmptyWorkers = state.workers.filter(
      (w) => w.displayName.trim() || w.identificationNumber.trim() || w.phone.trim(),
    );
    const newWorkerErrors: Record<string, FieldErrors> = {};
    let hasErrors = false;
    for (const w of nonEmptyWorkers) {
      const errors = validateWorker(w);
      if (Object.keys(errors).length > 0) {
        newWorkerErrors[w.id] = errors;
        hasErrors = true;
      }
    }
    if (hasErrors) {
      patch({ workerErrors: newWorkerErrors, apiError: 'Revisa los datos de tus trabajadores.' });
      return;
    }
    patch({ workerErrors: {}, loading: true, apiError: undefined });

    const farmPayload: RegisterFarmPayload = {
      name: state.farm.name.trim(),
      legalType: state.farm.legalType,
      taxIdType: state.farm.legalType === 'juridica' ? 'nit' : 'cedula',
      taxId: state.farm.taxId.trim(),
      location: state.farm.location.trim(),
      cebaCapacity: Number(state.farm.cebaCapacity),
      breedingCapacity: Number(state.farm.breedingCapacity),
      totalCapacity: Number(state.farm.totalCapacity),
      sanitaryRegistry: state.farm.sanitaryRegistry.trim(),
    };

    const result = await submitRegistration({
      kind: 'owner',
      user: buildUserPayload(),
      farm: farmPayload,
      workers: nonEmptyWorkers.map((w) => ({
        displayName: w.displayName.trim(),
        identificationNumber: w.identificationNumber.trim(),
        phone: toE164Phone(w.phone),
      })),
    });
    patch({ loading: false });
    if (result.ok) {
      storeToken(result.data.session.token);
      posthog?.identify(result.data.operatorId);
      posthog?.capture('registration_completed', {
        role: 'owner',
        workers_invited: nonEmptyWorkers.length,
        membership_status: result.data.membershipStatus,
      });
      patch({ registerResult: result.data, step: 4 });
      return;
    }
    handleRegisterError(result.error);
  }

  function handleGoBack(): void {
    if (state.step === 2) stopResendTimer();
    // Desde la elección de rol (paso 0) el "atrás" natural es la bienvenida:
    // antes ese paso no tenía salida y quedaba encerrado en el registro.
    if (state.step === 0) {
      patch({ screen: 'welcome', apiError: undefined });
      return;
    }
    patch((s) => ({
      step: Math.max(0, s.step - 1),
      accountErrors: {},
      farmErrors: {},
      otpError: undefined,
      apiError: undefined,
      emailNote: false,
    }));
  }

  function handlePrimaryAction(): void {
    switch (state.step) {
      case 1:
        handleContinueAccount();
        break;
      case 2:
        if (state.role === 'worker') void handleSubmitWorkerRequest();
        else handleContinueFarm();
        break;
      case 3:
        void handleFinishRegistration();
        break;
      default:
        break;
    }
  }

  function resetForNewFarm(): void {
    posthog?.capture('registration_another_farm_started');
    patch({
      step: 2,
      farm: INITIAL_FARM,
      workers: [],
      farmErrors: {},
      workerErrors: {},
      apiError: undefined,
    });
  }

  const { role, step } = state;
  // Mientras se restaura la sesión se mantiene el splash: así no se ve la
  // bienvenida un instante para saltar enseguida al perfil.
  if (state.restoring) return <SplashPage onSkip={() => undefined} />;
  if (state.screen === 'splash') return <SplashPage onSkip={() => patch({ screen: 'welcome' })} />;
  if (state.screen === 'welcome')
    return (
      <AppShell>
        <WelcomePage
          onRegister={() => patch({ screen: undefined })}
          onLogin={() => patch({ screen: 'login', apiError: undefined })}
        />
      </AppShell>
    );
  if (state.screen === 'verifyEmail')
    return (
      <AppShell>
        <VerifyEmailPage
          email={state.account.email}
          loading={state.loading}
          error={state.apiError}
          onVerify={(code) => void verifyEmail(code)}
          onResend={() => void beginEmailVerification()}
          onSkip={() => patch({ screen: undefined, step: 5 })}
        />
      </AppShell>
    );
  if (state.screen === 'login')
    return (
      <AppShell>
        <LoginPage
          loading={state.loading}
          error={state.apiError}
          destinations={state.loginDestinations}
          onFind={(id) => void findLogin(id)}
          onRequest={(id, kind) => void sendLogin(id, kind)}
          onVerify={(id, code) => void login(id, code)}
          onBack={() => patch({ screen: 'welcome', loginDestinations: null })}
        />
      </AppShell>
    );
  const totalSteps = totalStepsFor(role);
  const showWizard = step >= 1 && step <= totalSteps;
  const displayStep = Math.min(step, totalSteps);
  const isWorker = role === 'worker';
  const containerWidth = step === 6 ? 640 : 560;

  function otpTitle(): string {
    switch (state.selectedTransport) {
      case 'email':
        return 'Verifica tu correo';
      case 'telegram':
        return 'Verifica tu Telegram';
      case 'sms':
        return 'Verifica tu celular';
      case 'whatsapp':
        return 'Verifica tu WhatsApp';
      default:
        return 'Verifica tu contacto';
    }
  }

  function otpSubtitle(): string {
    return state.selectedTransport === 'email'
      ? 'Confirmamos tu correo para proteger el acceso a tu cuenta.'
      : 'Confirmamos tu número para proteger el acceso a tu cuenta.';
  }

  const titles: Record<number, string> = {
    1: 'Crea tu cuenta',
    2: isWorker ? 'Busca tu finca' : 'Registra tu finca',
    3: 'Invita a tu equipo',
  };
  const subtitles: Record<number, string> = {
    1: 'Estos datos identifican tu cuenta en PorcIA.',
    2: isWorker
      ? 'Busca la finca a la que perteneces y solicita unirte.'
      : 'Con estos datos configuramos el perfil productivo de tu finca.',
    3: 'Opcional: agrega a las personas que trabajan contigo.',
  };
  const primaryLabels: Record<number, string> = {
    1: 'Continuar',
    2: isWorker ? 'Enviar solicitud' : 'Continuar',
    3: 'Finalizar registro',
  };

  function otpIntroNode(): ReactNode {
    const transport = state.selectedTransport;
    if (!transport) return 'Selecciona cómo quieres recibir el código.';
    const label = TRANSPORT_LABELS[transport];
    if (transport === 'email') {
      return (
        <>
          Enviamos un código de verificación por {label} al correo{' '}
          <strong style={{ color: 'var(--ink)' }}>{state.account.email}</strong>.
        </>
      );
    }
    return (
      <>
        Enviamos un código de verificación por {label} al número{' '}
        <strong style={{ color: 'var(--ink)' }}>{formatPhoneDisplay(state.account.phone)}</strong>.
      </>
    );
  }

  const transportOptions = TRANSPORT_ORDER.filter((t) => state.otpTransports.includes(t)).map(
    (t) => ({
      value: t,
      label: TRANSPORT_LABELS[t],
    }),
  );

  // Conservan las utilidades de OTP listas para la verificación opcional
  // posterior, sin hacerlas parte del recorrido de registro.
  void enterOtpStep;
  void handleSelectTransport;
  void handleResend;
  void handleVerifyOtp;
  void otpTitle;
  void otpSubtitle;
  void otpIntroNode;
  void transportOptions;

  function renderStepContent(): ReactNode {
    if (step === 0)
      return (
        <RolePage
          onSelectRole={(r) => {
            posthog?.capture('registration_role_selected', { role: r });
            patch({ role: r, step: 1 });
          }}
        />
      );

    if (step === 1 && role) {
      return (
        <AccountPage
          value={state.account}
          errors={state.accountErrors}
          role={role}
          onChange={(fields) =>
            patch((s) => ({
              account: { ...s.account, ...fields },
              // Al reescribir el campo se limpia el aviso de duplicado.
              accountErrors: { ...s.accountErrors, ...blankErrorsFor(fields) },
            }))
          }
          onCheckField={(field) => void checkFieldAvailability(field)}
        />
      );
    }

    if (step === 2 && isWorker) {
      return (
        <FarmSearchPage
          query={state.farmSearchQuery}
          onQueryChange={(q) => patch({ farmSearchQuery: q })}
          results={state.farmSearchResults}
          selectedFarm={state.selectedFarm}
          onSelect={(farm) => {
            posthog?.capture('registration_farm_selected');
            patch({ selectedFarm: farm });
          }}
          searched={state.farmSearchDone}
        />
      );
    }

    if (step === 2 && !isWorker) {
      return (
        <FarmPage
          value={state.farm}
          errors={state.farmErrors}
          onChange={(fields) => patch((s) => ({ farm: { ...s.farm, ...fields } }))}
        />
      );
    }

    if (step === 3) {
      return (
        <TeamPage
          workers={state.workers}
          errors={state.workerErrors}
          onAdd={() =>
            patch((s) => ({
              workers: [
                ...s.workers,
                { id: nextWorkerId(), displayName: '', identificationNumber: '', phone: '' },
              ],
            }))
          }
          onRemove={(id) => patch((s) => ({ workers: s.workers.filter((w) => w.id !== id) }))}
          onChange={(id, fields) =>
            patch((s) => ({
              workers: s.workers.map((w) => (w.id === id ? { ...w, ...fields } : w)),
            }))
          }
        />
      );
    }

    if (step === 4 && role) {
      return (
        <SuccessPage
          role={role}
          farmName={state.farm.name}
          legalType={state.farm.legalType}
          workersCount={state.workers.filter((w) => w.displayName.trim()).length}
          selectedFarmName={state.selectedFarm?.name}
          onGoToProfile={() => patch({ step: 5 })}
          onRegisterAnotherFarm={resetForNewFarm}
          onVerifyEmail={() => void beginEmailVerification()}
        />
      );
    }

    if (step === 5 && role) {
      const isJuridica = state.farm.legalType === 'juridica';
      return (
        <ProfilePage
          role={role}
          identificationTypeLabel={ID_LABELS[state.account.identificationType]}
          identificationNumber={state.account.identificationNumber}
          phone={state.account.phone}
          email={state.account.email}
          farm={
            !isWorker
              ? {
                  name: state.farm.name,
                  legalTypeLabel: isJuridica ? 'Persona jurídica' : 'Persona natural',
                  taxIdLabel: isJuridica ? 'NIT' : 'Cédula de ciudadanía',
                  taxId: state.farm.taxId,
                  location: state.farm.location,
                  cebaCapacity: state.farm.cebaCapacity,
                  breedingCapacity: state.farm.breedingCapacity,
                  totalCapacity: state.farm.totalCapacity,
                  sanitaryRegistry: state.farm.sanitaryRegistry,
                }
              : undefined
          }
          workers={state.workers}
          selectedFarmName={state.selectedFarm?.name}
          membershipStatus={state.registerResult?.membershipStatus ?? state.membershipStatus}
          emailVerified={state.emailVerified}
          phoneKnown={state.phoneKnown}
          onVerifyEmail={() => void beginEmailVerification()}
          onLogout={logout}
        />
      );
    }

    return null;
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 'clamp(24px, 5vw, 56px) 20px 60px',
        fontFamily: 'var(--font-body)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          marginBottom: 'clamp(20px, 4vw, 28px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/porcia-mark.png"
            alt="PorcIA"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 20,
              color: 'var(--ink)',
            }}
          >
            PorcIA
          </span>
        </div>
      </div>

      <section style={{ width: '100%', maxWidth: containerWidth }}>
        {showWizard ? (
          <StepHeader
            totalSteps={totalSteps}
            currentStep={displayStep}
            title={titles[displayStep] ?? ''}
            subtitle={subtitles[displayStep] ?? ''}
          />
        ) : null}

        {step === 0 ? (
          <div style={{ marginBottom: 14, textAlign: 'center' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 24,
                color: 'var(--ink)',
              }}
            >
              ¿Cómo te unes a PorcIA?
            </h1>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 14,
                color: 'var(--text-body)',
                lineHeight: 1.5,
              }}
            >
              El registro funciona igual desde la web, WhatsApp o Telegram.
            </p>
          </div>
        ) : null}

        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderStepContent()}

            {state.apiError ? <ErrorBanner message={state.apiError} /> : null}

            {/* El paso 0 no forma parte del wizard numerado, pero también
                necesita salida: antes era un callejón sin retorno. */}
            {step === 0 ? (
              <Button variant="ghost" onClick={handleGoBack} style={{ alignSelf: 'flex-start' }}>
                Atrás
              </Button>
            ) : null}

            {showWizard ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {step >= 1 ? (
                  <Button variant="ghost" onClick={handleGoBack} disabled={state.loading}>
                    Atrás
                  </Button>
                ) : (
                  <span />
                )}
                <Button
                  variant="primary"
                  onClick={handlePrimaryAction}
                  loading={state.loading}
                  disabled={step === 2 && isWorker && !state.selectedFarm}
                >
                  {primaryLabels[step] ?? 'Continuar'}
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </section>
    </main>
  );
}
