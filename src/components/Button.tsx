import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const baseStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  borderRadius: 15,
  padding: '14px 26px',
  minHeight: 52,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxSizing: 'border-box',
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    boxShadow: 'var(--shadow-soft)',
  },
  ghost: {
    background: 'none',
    color: 'var(--ink)',
    border: '1.5px solid var(--border-soft)',
  },
};

/** Botón de marca PorcIA: primario (terracota, CTA) o ghost (contorno). */
export function Button({ variant = 'primary', className, style, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={['pia-btn', `pia-btn--${variant}`, className].filter(Boolean).join(' ')}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
