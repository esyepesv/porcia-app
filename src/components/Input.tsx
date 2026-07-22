import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  id?: string;
}

/**
 * Input de texto de marca PorcIA: label arriba, borde suave, radio 14px,
 * mensaje de error debajo en var(--accent-ink) cuando aplica.
 */
export function Input({ label, error, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <label htmlFor={inputId} style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
        {label}
      </label>
      <input
        id={inputId}
        className={className}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        style={{
          width: '100%',
          height: 52,
          boxSizing: 'border-box',
          padding: '0 16px',
          fontSize: 15,
          fontFamily: 'var(--font-body)',
          color: 'var(--ink)',
          background: '#fff',
          border: `1.5px solid ${error ? 'var(--accent-ink)' : 'var(--border-soft)'}`,
          borderRadius: 14,
        }}
        {...rest}
      />
      {error ? (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ marginTop: -2, fontSize: 12.5, color: 'var(--accent-ink)' }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
