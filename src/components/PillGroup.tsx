interface PillOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface PillGroupProps<T extends string> {
  legend: string;
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
}

/** Grupo de píldoras seleccionables (tipo de identificación, tipo de persona, transporte OTP...). */
export function PillGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  name,
}: PillGroupProps<T>) {
  return (
    <div role="group" aria-label={legend}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', marginBottom: 8 }}>
        {legend}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              name={name}
              aria-pressed={selected}
              disabled={opt.disabled}
              onClick={() => onChange(opt.value)}
              className={['pia-pill', selected ? 'pia-pill--selected' : '']
                .filter(Boolean)
                .join(' ')}
              style={{
                background: selected ? 'var(--teal)' : '#fff',
                color: selected ? '#fff' : 'var(--ink)',
                border: `1.5px solid ${selected ? 'var(--teal)' : 'var(--border-soft)'}`,
                borderRadius: 999,
                padding: '10px 18px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 14,
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                opacity: opt.disabled ? 0.5 : 1,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
