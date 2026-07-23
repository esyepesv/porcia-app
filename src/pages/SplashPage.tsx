interface SplashPageProps {
  onSkip: () => void;
}

/** Splash de marca a pantalla completa — cold-start, sin decisiones. Pasa a bienvenida sola o al click. */
export function SplashPage({ onSkip }: SplashPageProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSkip}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSkip()}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        background: 'var(--bg-dark)',
        cursor: 'pointer',
      }}
    >
      <img
        src="/porcia-mark.png"
        alt="PorcIA"
        style={{ width: 72, height: 72, objectFit: 'contain' }}
      />
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 28,
          color: 'var(--cream)',
        }}
      >
        PorcIA
      </h1>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-on-dark)' }}>
        Tu asistente porcícola
      </span>
    </div>
  );
}
