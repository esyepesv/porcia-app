import { Button } from '../components/Button';

interface WelcomePageProps {
  onRegister: () => void;
  onLogin: () => void;
}

/** Bienvenida — hub de entrada: separa "iniciar sesión" de "registrarme" antes del wizard. */
export function WelcomePage({ onRegister, onLogin }: WelcomePageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
      <img src="/porcia-mark.png" alt="PorcIA" style={{ width: 48, height: 48, objectFit: 'contain' }} />
      <div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--ink)' }}>
          Bienvenido a PorcIA
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-body)', lineHeight: 1.5 }}>
          ¿Cómo quieres continuar?
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        <Button variant="primary" onClick={onRegister}>Registrarme</Button>
        <Button variant="ghost" onClick={onLogin}>Ya tengo cuenta</Button>
      </div>
    </div>
  );
}
