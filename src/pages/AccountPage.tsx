import { Input } from '../components/Input';
import { PillGroup } from '../components/PillGroup';
import { sanitizeIdentificationInput, sanitizePhoneInput } from '../lib/validation';
import type { AccountFormState, FieldErrors, IdentificationType, Role } from '../lib/types';

interface AccountPageProps {
  value: AccountFormState;
  errors: FieldErrors;
  role: Role;
  onChange: (patch: Partial<AccountFormState>) => void;
}

const ID_OPTIONS: { value: IdentificationType; label: string }[] = [
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PPT', label: 'Permiso por Protección Temporal' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia' },
  { value: 'PA', label: 'Pasaporte' },
];

/** Paso 1 — cuenta: tipo de identificación, número, celular y correo opcional. */
export function AccountPage({ value, errors, role, onChange }: AccountPageProps) {
  const roleHint =
    role === 'owner'
      ? 'Te registras como Administrador/dueño de la cuenta. Podrás invitar trabajadores más adelante.'
      : 'Te registras como Trabajador. En el siguiente paso buscarás tu finca y enviarás una solicitud para unirte.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PillGroup
        legend="Tipo de identificación"
        name="identificationType"
        options={ID_OPTIONS}
        value={value.identificationType}
        onChange={(v) => onChange({ identificationType: v })}
      />

      <Input
        label="Número de identificación"
        placeholder="Ej. 1032456789"
        value={value.identificationNumber}
        error={errors.identificationNumber}
        onChange={(e) => onChange({ identificationNumber: sanitizeIdentificationInput(e.target.value) })}
      />

      <Input
        label="Celular (WhatsApp)"
        type="tel"
        inputMode="numeric"
        placeholder="Ej. 3001234567"
        value={value.phone}
        error={errors.phone}
        onChange={(e) => onChange({ phone: sanitizePhoneInput(e.target.value) })}
      />

      <Input
        label="Correo electrónico (opcional)"
        type="email"
        placeholder="tucorreo@ejemplo.com"
        value={value.email}
        error={errors.email}
        onChange={(e) => onChange({ email: e.target.value })}
      />

      <div
        style={{
          background: 'var(--bg)',
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flex: 'none',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--teal)',
            marginTop: 6,
          }}
        />
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-body)' }}>
          {roleHint}
        </p>
      </div>
    </div>
  );
}
