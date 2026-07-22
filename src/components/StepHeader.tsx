interface StepHeaderProps {
  totalSteps: number;
  currentStep: number;
  title: string;
  subtitle: string;
}

/** Barra de segmentos de progreso + "Paso N de M" + título/subtítulo del paso. */
export function StepHeader({ totalSteps, currentStep, title, subtitle }: StepHeaderProps) {
  const segments = Array.from({ length: totalSteps }, (_, i) => i < currentStep);

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }} aria-hidden="true">
        {segments.map((filled, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 999,
              background: filled ? 'var(--teal)' : 'var(--border-soft)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 22,
            color: 'var(--ink)',
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Paso {currentStep} de {totalSteps}
        </span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-body)', lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </div>
  );
}
