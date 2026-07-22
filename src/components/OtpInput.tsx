import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useRef } from 'react';

const BOX_COUNT = 6;

interface OtpInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
}

/** 6 casillas de código OTP: avanzan/retroceden con teclado y aceptan pegar el código completo. */
export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const errorId = 'otp-error';

  function setDigit(index: number, digit: string) {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 0) {
      setDigit(index, '');
      return;
    }
    if (digits.length > 1) {
      // El usuario pegó o el teclado móvil mandó varios dígitos de una vez.
      distribute(index, digits);
      return;
    }
    setDigit(index, digits);
    if (index < BOX_COUNT - 1) refs.current[index + 1]?.focus();
  }

  function distribute(startIndex: number, digits: string) {
    const next = [...value];
    let cursor = startIndex;
    for (const digit of digits) {
      if (cursor >= BOX_COUNT) break;
      next[cursor] = digit;
      cursor += 1;
    }
    onChange(next);
    const focusIndex = Math.min(cursor, BOX_COUNT - 1);
    refs.current[focusIndex]?.focus();
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    distribute(index, pasted);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !value[index] && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      setDigit(index - 1, '');
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < BOX_COUNT - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        {Array.from({ length: BOX_COUNT }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="otp-box"
            aria-label={`Dígito ${i + 1} de ${BOX_COUNT}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            maxLength={i === 0 ? BOX_COUNT : 1}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={value[i] ?? ''}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            style={{
              width: 44,
              height: 54,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              border: `1.5px solid ${error ? 'var(--accent-ink)' : 'var(--border-soft)'}`,
              borderRadius: 12,
              color: 'var(--ink)',
            }}
          />
        ))}
      </div>
      {error ? (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ fontSize: 12.5, color: 'var(--accent-ink)' }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
