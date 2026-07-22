import type { FarmSearchResult } from '../lib/types';

interface FarmResultRowProps {
  farm: FarmSearchResult;
  selected: boolean;
  onSelect: () => void;
}

/** Fila seleccionable de un resultado de búsqueda de finca (paso 3, trabajador). */
export function FarmResultRow({ farm, selected, onSelect }: FarmResultRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="pia-farm-row"
      style={{
        border: `1.5px solid ${selected ? 'var(--teal)' : 'var(--border-soft)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: selected ? 'var(--bg)' : '#fff',
        width: '100%',
        textAlign: 'left',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--ink)',
          }}
        >
          {farm.name}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
          {farm.location} · Admin: {farm.adminName}
        </span>
      </span>
      <span
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `1.5px solid ${selected ? 'var(--teal)' : 'var(--border-soft)'}`,
          background: selected ? 'var(--teal)' : 'transparent',
          flex: 'none',
        }}
      />
    </button>
  );
}
