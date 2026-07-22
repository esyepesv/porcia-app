interface ErrorBannerProps {
  message: string;
}

/** Aviso de error general (red caída, error del servidor) — no ligado a un campo puntual. */
export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        background: '#FBEDE8',
        border: '1px solid var(--accent-ink)',
        borderRadius: 14,
        padding: '12px 16px',
        fontSize: 13.5,
        lineHeight: 1.5,
        color: 'var(--accent-ink)',
      }}
    >
      {message}
    </div>
  );
}
