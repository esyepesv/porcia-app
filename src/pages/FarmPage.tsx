import { Input } from '../components/Input';
import { PillGroup } from '../components/PillGroup';
import { sanitizeDigitsInput } from '../lib/validation';
import type { FarmFormState, FieldErrors, LegalType } from '../lib/types';

interface FarmPageProps {
  value: FarmFormState;
  errors: FieldErrors;
  onChange: (patch: Partial<FarmFormState>) => void;
}

const LEGAL_TYPE_OPTIONS: { value: LegalType; label: string }[] = [
  { value: 'natural', label: 'Persona natural' },
  { value: 'juridica', label: 'Persona jurídica' },
];

/** Paso 3 (dueño) — registro de finca: los 8 campos productivos/legales. */
export function FarmPage({ value, errors, onChange }: FarmPageProps) {
  const isJuridica = value.legalType === 'juridica';
  const idLabel = isJuridica ? 'NIT' : 'Cédula de ciudadanía';
  const idPlaceholder = isJuridica ? 'Ej. 900123456-7' : 'Ej. 1032456789';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Input
        label="Nombre de la finca/granja"
        placeholder="Ej. Finca La Esperanza"
        value={value.name}
        error={errors.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />

      <PillGroup
        legend="Tipo de persona"
        name="legalType"
        options={LEGAL_TYPE_OPTIONS}
        value={value.legalType}
        onChange={(v) => onChange({ legalType: v, taxId: '' })}
      />

      <Input
        label={idLabel}
        placeholder={idPlaceholder}
        value={value.taxId}
        error={errors.taxId}
        onChange={(e) => onChange({ taxId: sanitizeDigitsInput(e.target.value) })}
      />

      <Input
        label="Ubicación (vereda, municipio, departamento)"
        placeholder="Ej. Vereda El Rosal, Sonsón, Antioquia"
        value={value.location}
        error={errors.location}
        onChange={(e) => onChange({ location: e.target.value })}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Input
          label="Capacidad de ceba"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={value.cebaCapacity}
          error={errors.cebaCapacity}
          onChange={(e) => onChange({ cebaCapacity: e.target.value })}
        />
        <Input
          label="Capacidad de cría"
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          value={value.breedingCapacity}
          error={errors.breedingCapacity}
          onChange={(e) => onChange({ breedingCapacity: e.target.value })}
        />
      </div>

      <Input
        label="Capacidad total (cerdos)"
        type="number"
        min={0}
        inputMode="numeric"
        placeholder="0"
        value={value.totalCapacity}
        error={errors.totalCapacity}
        onChange={(e) => onChange({ totalCapacity: e.target.value })}
      />

      <Input
        label="Registro sanitario (ICA)"
        placeholder="Ej. RS-00123456"
        value={value.sanitaryRegistry}
        error={errors.sanitaryRegistry}
        onChange={(e) => onChange({ sanitaryRegistry: e.target.value })}
      />
    </div>
  );
}
