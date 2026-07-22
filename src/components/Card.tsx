import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
}

/** Contenedor blanco redondeado con sombra suave — el panel principal del wizard. */
export function Card({ children }: CardProps) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 'clamp(24px, 4vw, 34px)',
        background: '#fff',
        border: '1px solid var(--border-soft)',
        boxShadow: '0 12px 32px rgba(44, 53, 49, .1)',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}
