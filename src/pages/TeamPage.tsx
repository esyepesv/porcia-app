import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { sanitizeDigitsInput, sanitizePhoneInput } from '../lib/validation';
import type { FieldErrors, WorkerDraft } from '../lib/types';

interface TeamPageProps {
  workers: WorkerDraft[];
  errors: Record<string, FieldErrors>;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, patch: Partial<WorkerDraft>) => void;
}

/** Paso 4 (dueño, opcional) — invitar trabajadores: nombre, cédula, celular. */
export function TeamPage({ workers, errors, onAdd, onRemove, onChange }: TeamPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--text-body)' }}>
        ¿Quieres invitar trabajadores a tu finca ahora? Podrás hacerlo también más tarde desde tu
        panel.
      </p>

      {workers.map((worker) => {
        const workerErrors = errors[worker.id] ?? {};
        return (
          <div
            key={worker.id}
            style={{
              border: '1px solid var(--border-soft)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => onRemove(worker.id)}
              className="pia-link-btn"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Quitar
            </button>
            <Input
              label="Nombre completo"
              placeholder="Nombre del trabajador"
              value={worker.displayName}
              error={workerErrors.displayName}
              onChange={(e) => onChange(worker.id, { displayName: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Cédula"
                placeholder="Número"
                value={worker.identificationNumber}
                error={workerErrors.identificationNumber}
                onChange={(e) =>
                  onChange(worker.id, { identificationNumber: sanitizeDigitsInput(e.target.value) })
                }
              />
              <Input
                label="Celular (WhatsApp)"
                type="tel"
                inputMode="numeric"
                placeholder="Número"
                value={worker.phone}
                error={workerErrors.phone}
                onChange={(e) => onChange(worker.id, { phone: sanitizePhoneInput(e.target.value) })}
              />
            </div>
          </div>
        );
      })}

      <Button
        variant="ghost"
        onClick={onAdd}
        style={{
          alignSelf: 'flex-start',
          border: '1.5px dashed var(--border-strong)',
          padding: '11px 20px',
          minHeight: 'auto',
          boxShadow: 'none',
        }}
      >
        + Agregar trabajador
      </Button>
    </div>
  );
}
