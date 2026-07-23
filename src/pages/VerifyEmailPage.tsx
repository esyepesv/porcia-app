import { useState } from 'react';
import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';

interface VerifyEmailPageProps {
  email: string;
  loading: boolean;
  error?: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onSkip: () => void;
}

export function VerifyEmailPage({
  email,
  loading,
  error,
  onVerify,
  onResend,
  onSkip,
}: VerifyEmailPageProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, color: 'var(--text-body)', lineHeight: 1.5 }}>
        Enviamos un código a <strong>{email}</strong>. Esto no es necesario para usar PorcIA; te
        ayuda a recuperar el acceso desde otro computador.
      </p>
      <OtpInput value={digits} onChange={setDigits} error={error} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="primary"
          loading={loading}
          disabled={digits.join('').length !== 6}
          onClick={() => onVerify(digits.join(''))}
        >
          Verificar correo
        </Button>
        <Button variant="ghost" disabled={loading} onClick={onResend}>
          Reenviar código
        </Button>
      </div>
      <button
        type="button"
        className="pia-link-btn"
        onClick={onSkip}
        style={{
          border: 0,
          background: 'none',
          color: 'var(--teal)',
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        Ahora no
      </button>
    </div>
  );
}
