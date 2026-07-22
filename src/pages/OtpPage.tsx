import type { ReactNode } from 'react';
import { OtpInput } from '../components/OtpInput';
import { PillGroup } from '../components/PillGroup';
import type { OtpTransport } from '../lib/types';

interface TransportOption {
  value: OtpTransport;
  label: string;
}

interface OtpPageProps {
  transportOptions: TransportOption[];
  selectedTransport: OtpTransport | null;
  onSelectTransport: (transport: OtpTransport) => void;
  introNode: ReactNode;
  otpDigits: string[];
  onOtpChange: (digits: string[]) => void;
  otpError?: string;
  emailNote: boolean;
  onGoToAccount: () => void;
  resendTimer: number;
  onResend: () => void;
}

/** Paso 2 — verificación OTP: selector de transporte (si hay más de uno) + 6 casillas + reenvío. */
export function OtpPage({
  transportOptions,
  selectedTransport,
  onSelectTransport,
  introNode,
  otpDigits,
  onOtpChange,
  otpError,
  emailNote,
  onGoToAccount,
  resendTimer,
  onResend,
}: OtpPageProps) {
  const resendDisabled = resendTimer > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {transportOptions.length > 1 ? (
        <div style={{ width: '100%', textAlign: 'left' }}>
          <PillGroup
            legend="¿Cómo quieres recibir el código?"
            name="otpTransport"
            options={transportOptions}
            value={selectedTransport ?? transportOptions[0]?.value ?? 'whatsapp'}
            onChange={onSelectTransport}
          />
        </div>
      ) : null}

      {emailNote ? (
        <div
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '12px 16px',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-body)',
          }}
        >
          Agrega un correo en el paso anterior para recibir el código allí.{' '}
          <button
            type="button"
            onClick={onGoToAccount}
            className="pia-link-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 13,
              color: 'var(--teal)',
              cursor: 'pointer',
            }}
          >
            Volver a agregar correo
          </button>
        </div>
      ) : null}

      <div
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--teal)' }} />
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: 'var(--text-body)',
          maxWidth: 380,
        }}
      >
        {introNode}
      </p>

      <OtpInput value={otpDigits} onChange={onOtpChange} error={otpError} />

      <button
        type="button"
        onClick={onResend}
        disabled={resendDisabled}
        className="pia-link-btn"
        style={{
          background: 'none',
          border: 'none',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 13.5,
          cursor: resendDisabled ? 'default' : 'pointer',
          color: resendDisabled ? 'var(--text-muted)' : 'var(--teal)',
        }}
      >
        {resendDisabled ? `Reenviar código (${resendTimer}s)` : 'Reenviar código'}
      </button>
    </div>
  );
}
