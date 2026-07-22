import type { CSSProperties } from 'react';
import type { Role } from '../lib/types';

interface RolePageProps {
  onSelectRole: (role: Role) => void;
}

const cardStyle: CSSProperties = {
  border: '1.5px solid var(--border-soft)',
  borderRadius: 20,
  padding: 22,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  background: '#fff',
  textAlign: 'left',
  width: '100%',
  fontFamily: 'var(--font-body)',
};

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: 17,
  color: 'var(--ink)',
};

const descStyle: CSSProperties = {
  fontSize: 13.5,
  color: 'var(--text-body)',
  lineHeight: 1.5,
};

/** Paso 0 — elección de rol. Tarjetas como <button> reales (accesibilidad). */
export function RolePage({ onSelectRole }: RolePageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button
        type="button"
        className="pia-role-card"
        style={cardStyle}
        onClick={() => onSelectRole('owner')}
      >
        <span style={titleStyle}>Soy dueño/administrador</span>
        <span style={descStyle}>Voy a registrar mi finca desde cero y administrar mi equipo.</span>
      </button>
      <button
        type="button"
        className="pia-role-card"
        style={cardStyle}
        onClick={() => onSelectRole('worker')}
      >
        <span style={titleStyle}>Soy trabajador</span>
        <span style={descStyle}>Quiero unirme a una finca que ya está registrada en PorcIA.</span>
      </button>
    </div>
  );
}
