import { FarmResultRow } from '../components/FarmResultRow';
import { Input } from '../components/Input';
import type { FarmSearchResult } from '../lib/types';

interface FarmSearchPageProps {
  query: string;
  onQueryChange: (query: string) => void;
  results: FarmSearchResult[];
  selectedFarm: FarmSearchResult | null;
  onSelect: (farm: FarmSearchResult) => void;
  searched: boolean;
}

/** Paso 3 (trabajador) — búsqueda de finca por nombre/ubicación y selección. */
export function FarmSearchPage({
  query,
  onQueryChange,
  results,
  selectedFarm,
  onSelect,
  searched,
}: FarmSearchPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        label="Busca tu finca"
        placeholder="Nombre de la finca o ubicación"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((farm) => (
          <FarmResultRow
            key={farm.id}
            farm={farm}
            selected={farm.id === selectedFarm?.id}
            onSelect={() => onSelect(farm)}
          />
        ))}
        {searched && results.length === 0 ? (
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-muted)' }}>
            No encontramos fincas con ese nombre. Verifica con tu administrador el nombre exacto.
          </p>
        ) : null}
      </div>

      {selectedFarm ? (
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 14,
            padding: '14px 16px',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--text-body)',
          }}
        >
          Enviaremos tu solicitud al administrador de{' '}
          <strong style={{ color: 'var(--ink)' }}>{selectedFarm.name}</strong> para que apruebe tu
          ingreso como trabajador.
        </div>
      ) : null}
    </div>
  );
}
