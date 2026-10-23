import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', 'aria-describedby': describedBy, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={`field ${className}`.trim()}>
      <label className="field__label" htmlFor={inputId}>{label}</label>
      <input
        className="field__input"
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[describedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {error && <p className="field__error" id={errorId}>{error}</p>}
    </div>
  );
}
