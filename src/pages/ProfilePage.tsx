import type { MembershipStatus, Role, WorkerDraft } from '../lib/types';

interface ProfileFarmData {
  name: string;
  legalTypeLabel: string;
  taxIdLabel: string;
  taxId: string;
  location: string;
  cebaCapacity: string;
  breedingCapacity: string;
  totalCapacity: string;
  sanitaryRegistry: string;
}

interface ProfilePageProps {
  role: Role;
  identificationTypeLabel: string;
  identificationNumber: string;
  phone: string;
  email: string;
  farm?: ProfileFarmData;
  workers: WorkerDraft[];
  selectedFarmName?: string;
  membershipStatus?: MembershipStatus;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-soft)',
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

/** Paso 6 — perfil de solo lectura (sin edición: diferencia deliberada con el diseño, spec 001). */
export function ProfilePage({
  role,
  identificationTypeLabel,
  identificationNumber,
  phone,
  email,
  farm,
  workers,
  selectedFarmName,
  membershipStatus,
}: ProfilePageProps) {
  const isOwner = role === 'owner';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 19,
              color: 'var(--ink)',
            }}
          >
            Tu cuenta
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Row label="Rol" value={isOwner ? 'Administrador/dueño' : 'Trabajador'} />
          <Row label="Tipo de identificación" value={identificationTypeLabel} />
          <Row label="Identificación" value={identificationNumber || '—'} />
          <Row label="Celular (WhatsApp)" value={phone || '—'} />
          <Row label="Correo electrónico" value={email || '—'} />
        </div>
      </div>

      {isOwner && farm ? (
        <div>
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 19,
                color: 'var(--ink)',
              }}
            >
              Tu finca
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Row label="Nombre" value={farm.name || '—'} />
            <Row label="Tipo de persona" value={farm.legalTypeLabel} />
            <Row label={farm.taxIdLabel} value={farm.taxId || '—'} />
            <Row label="Ubicación" value={farm.location || '—'} />
            <Row label="Capacidad de ceba" value={farm.cebaCapacity || '—'} />
            <Row label="Capacidad de cría" value={farm.breedingCapacity || '—'} />
            <Row label="Capacidad total" value={farm.totalCapacity || '—'} />
            <Row label="Registro sanitario (ICA)" value={farm.sanitaryRegistry || '—'} />
          </div>

          {workers.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                Equipo invitado
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {workers.map((w) => (
                  <span
                    key={w.id}
                    style={{
                      background: 'var(--tan)',
                      color: 'var(--ink)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 999,
                    }}
                  >
                    {w.displayName}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isOwner ? (
        <div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 19,
              color: 'var(--ink)',
            }}
          >
            Tu solicitud
          </span>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label="Finca" value={selectedFarmName ?? '—'} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
              }}
            >
              <span style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>Estado</span>
              <span
                style={{
                  background: 'var(--bg-alt)',
                  color: 'var(--ink)',
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1.5px dashed var(--border-strong)',
                }}
              >
                {membershipStatus === 'activo' ? 'Activo' : 'Pendiente de aprobación'}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
