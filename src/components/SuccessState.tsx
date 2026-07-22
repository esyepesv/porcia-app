import type { ReactNode } from 'react';

interface SuccessStateProps {
  title: string;
  children: ReactNode;
}

/** Confirmación post-registro: ícono circular, título y copy de resumen. */
export function SuccessState({ title, children }: SuccessStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 14,
        padding: '12px 0 6px',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            width: 26,
            height: 14,
            borderLeft: '3px solid var(--teal)',
            borderBottom: '3px solid var(--teal)',
            transform: 'rotate(-45deg) translate(2px, -3px)',
          }}
        />
      </div>
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
      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: 'var(--text-body)',
          maxWidth: 420,
        }}
      >
        {children}
      </p>
    </div>
  );
}
