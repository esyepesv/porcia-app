import { useState } from 'react';
import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';
import type { LoginDestination } from '../lib/types';

interface LoginPageProps { loading: boolean; error?: string; destinations: LoginDestination[] | null; onFind: (identifier: string) => void; onRequest: (identifier: string, kind: LoginDestination['kind']) => void; onVerify: (identifier: string, code: string) => void; onBack: () => void; }
export function LoginPage({ loading, error, destinations, onFind, onRequest, onVerify, onBack }: LoginPageProps) {
  const [identifier, setIdentifier] = useState(''); const [code, setCode] = useState(['', '', '', '', '', '']);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Inicia sesión</h2>
    <label style={{ display: 'grid', gap: 6 }}>Documento de identidad o correo<input value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></label>
    {!destinations ? <Button variant="primary" disabled={loading || !identifier.trim()} onClick={() => onFind(identifier)}>Continuar</Button> : <>
      <p style={{ margin: 0, color: 'var(--text-body)' }}>Elige dónde recibir tu código.</p>
      {destinations.map((d) => <Button key={`${d.kind}-${d.masked}`} variant="ghost" disabled={loading} onClick={() => onRequest(identifier, d.kind)}>{d.masked}</Button>)}
      <OtpInput value={code} onChange={setCode} error={error} />
      <Button variant="primary" disabled={loading || code.join('').length !== 6} onClick={() => onVerify(identifier, code.join(''))}>Ingresar</Button>
    </>}
    {error ? <p role="alert" style={{ color: 'var(--accent-ink)', margin: 0 }}>{error}</p> : null}
    <Button variant="ghost" onClick={onBack}>Volver</Button>
  </div>;
}
