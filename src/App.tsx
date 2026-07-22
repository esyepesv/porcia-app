import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  getOtpTransports,
  requestOtp,
  searchFarms,
  storeToken,
  submitRegistration,
  verifyOtp,
  type ApiError,
} from './lib/api';
import { toUserMessage } from './lib/errors';
import type {
  AccountFormState,
  Channel,
  FarmFormState,
  FarmSearchResult,
  FieldErrors,
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
import { TeamPage } from './pages/TeamPage';

const ID_LABELS: Record<AccountFormState['identificationType'], string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
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
};

function totalStepsFor(role: Role | null): number {
  return role === 'worker' ? 3 : 4;
}

let workerUidCounter = 0;
function nextWorkerId(): string {
  workerUidCounter += 1;
  return `w${workerUidCounter}`;
}

export function App() {
  const [state, setState] = useState<UiState>(INITIAL_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function patch(update: Partial<UiState> | ((s: UiState) => Partial<UiState>)): void {
    setState((prev) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }));
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

  // Búsqueda de finca (trabajador, paso 3), con debounce de 300ms.
  useEffect(() => {
    if (!(state.step === 3 && state.role === 'worker')) return;
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
      void doRequestOtp(transport);
    }
  }

  function handleResend(): void {
    if (state.resendTimer > 0) return;
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
        patch({ step: 3, otpError: undefined });
      } else {
        patch({ otpError: 'Código incorrecto. Verifica los 6 dígitos.' });
      }
      return;
    }
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
      ...(trimmedEmail ? { email: trimmedEmail } : {}),
    };
  }

  function handleRegisterError(error: ApiError): void {
    if (error.kind === 'api' && error.code === 'phone_not_verified') {
      patch({
        step: 2,
        apiError: 'Necesitamos verificar tu contacto de nuevo antes de continuar.',
      });
      return;
    }
    patch({ apiError: toUserMessage(error) });
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
    patch({ accountErrors: {} });
    void enterOtpStep();
  }

  function handleContinueFarm(): void {
    const errors = validateFarm(state.farm);
    if (Object.keys(errors).length > 0) {
      patch({ farmErrors: errors });
      return;
    }
    patch({ farmErrors: {}, step: 4 });
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
      patch({ registerResult: result.data, step: 5 });
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
      patch({ registerResult: result.data, step: 5 });
      return;
    }
    handleRegisterError(result.error);
  }

  function handleGoBack(): void {
    if (state.step === 2) stopResendTimer();
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
        void handleVerifyOtp();
        break;
      case 3:
        if (state.role === 'worker') void handleSubmitWorkerRequest();
        else handleContinueFarm();
        break;
      case 4:
        void handleFinishRegistration();
        break;
      default:
        break;
    }
  }

  function resetForNewFarm(): void {
    patch({
      step: 3,
      farm: INITIAL_FARM,
      workers: [],
      farmErrors: {},
      workerErrors: {},
      apiError: undefined,
    });
  }

  const { role, step } = state;
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
    2: otpTitle(),
    3: isWorker ? 'Busca tu finca' : 'Registra tu finca',
    4: 'Invita a tu equipo',
  };
  const subtitles: Record<number, string> = {
    1: 'Estos datos identifican tu cuenta en PorcIA.',
    2: otpSubtitle(),
    3: isWorker
      ? 'Busca la finca a la que perteneces y solicita unirte.'
      : 'Con estos datos configuramos el perfil productivo de tu finca.',
    4: 'Opcional: agrega a las personas que trabajan contigo.',
  };
  const primaryLabels: Record<number, string> = {
    1: 'Continuar',
    2: 'Verificar código',
    3: isWorker ? 'Enviar solicitud' : 'Continuar',
    4: 'Finalizar registro',
  };

  const primaryDisabled =
    state.loading ||
    (step === 2 && !state.selectedTransport) ||
    (step === 3 && isWorker && !state.selectedFarm);

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

  function renderStepContent(): ReactNode {
    if (step === 0) return <RolePage onSelectRole={(r) => patch({ role: r, step: 1 })} />;

    if (step === 1 && role) {
      return (
        <AccountPage
          value={state.account}
          errors={state.accountErrors}
          role={role}
          onChange={(fields) => patch((s) => ({ account: { ...s.account, ...fields } }))}
        />
      );
    }

    if (step === 2) {
      return (
        <OtpPage
          transportOptions={transportOptions}
          selectedTransport={state.selectedTransport}
          onSelectTransport={handleSelectTransport}
          introNode={otpIntroNode()}
          otpDigits={state.otpDigits}
          onOtpChange={(digits) => patch({ otpDigits: digits, otpError: undefined })}
          otpError={state.otpError}
          emailNote={state.emailNote}
          onGoToAccount={() => patch({ step: 1, emailNote: false })}
          resendTimer={state.resendTimer}
          onResend={handleResend}
        />
      );
    }

    if (step === 3 && isWorker) {
      return (
        <FarmSearchPage
          query={state.farmSearchQuery}
          onQueryChange={(q) => patch({ farmSearchQuery: q })}
          results={state.farmSearchResults}
          selectedFarm={state.selectedFarm}
          onSelect={(farm) => patch({ selectedFarm: farm })}
          searched={state.farmSearchDone}
        />
      );
    }

    if (step === 3 && !isWorker) {
      return (
        <FarmPage
          value={state.farm}
          errors={state.farmErrors}
          onChange={(fields) => patch((s) => ({ farm: { ...s.farm, ...fields } }))}
        />
      );
    }

    if (step === 4) {
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

    if (step === 5 && role) {
      return (
        <SuccessPage
          role={role}
          farmName={state.farm.name}
          legalType={state.farm.legalType}
          workersCount={state.workers.filter((w) => w.displayName.trim()).length}
          selectedFarmName={state.selectedFarm?.name}
          onGoToProfile={() => patch({ step: 6 })}
          onRegisterAnotherFarm={resetForNewFarm}
        />
      );
    }

    if (step === 6 && role) {
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
          membershipStatus={state.registerResult?.membershipStatus}
        />
      );
    }

    return null;
  }

  return (
    <div
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

      <div style={{ width: '100%', maxWidth: containerWidth }}>
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
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 24,
                color: 'var(--ink)',
              }}
            >
              ¿Cómo te unes a PorcIA?
            </span>
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
                <Button variant="primary" onClick={handlePrimaryAction} disabled={primaryDisabled}>
                  {primaryLabels[step] ?? 'Continuar'}
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
