import { Button } from '../components/Button';
import { SuccessState } from '../components/SuccessState';
import type { LegalType, Role } from '../lib/types';

interface SuccessPageProps {
  role: Role;
  farmName: string;
  legalType: LegalType;
  workersCount: number;
  selectedFarmName?: string;
  onGoToProfile: () => void;
  onRegisterAnotherFarm: () => void;
}

/** Paso 5 — confirmación de éxito con badges de resumen. */
export function SuccessPage({
  role,
  farmName,
  legalType,
  workersCount,
  selectedFarmName,
  onGoToProfile,
  onRegisterAnotherFarm,
}: SuccessPageProps) {
  const isWorker = role === 'worker';

  const title = isWorker ? 'Solicitud enviada' : '¡Tu finca ya está registrada!';
  const copy = isWorker
    ? `Enviamos tu solicitud al administrador de ${selectedFarmName ?? 'la finca'}. Te avisaremos por WhatsApp cuando sea aprobada.`
    : `${farmName || 'Tu finca'} quedó registrada junto con tu cuenta de administrador. Ya puedes ingresar a PorcIA desde WhatsApp.`;

  const badges = isWorker
    ? [selectedFarmName ?? 'Finca', 'Solicitud pendiente']
    : [
        farmName || 'Finca',
        `${workersCount} trabajador${workersCount === 1 ? '' : 'es'} invitado${workersCount === 1 ? '' : 's'}`,
        legalType === 'juridica' ? 'Persona jurídica' : 'Persona natural',
      ];

  return (
    <div>
      <SuccessState title={title}>{copy}</SuccessState>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
          flexWrap: 'wrap',
          marginTop: 6,
        }}
      >
        {badges.map((badge) => (
          <span
            key={badge}
            style={{
              background: 'var(--tan)',
              color: 'var(--ink)',
              fontSize: 12.5,
              fontWeight: 700,
              padding: '6px 14px',
              borderRadius: 999,
            }}
          >
            {badge}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginTop: 22,
          flexWrap: 'wrap',
        }}
      >
        <Button variant="primary" onClick={onGoToProfile}>
          Ver mi perfil
        </Button>
        {!isWorker ? (
          <Button variant="ghost" onClick={onRegisterAnotherFarm}>
            Registrar otra finca
          </Button>
        ) : null}
      </div>
    </div>
  );
}
