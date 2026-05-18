import React, { useState } from 'react'

type InputProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  error?: string
  helper?: string
  type?: string
}

export function Input({
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
  error,
  helper,
  type = 'text',
}: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <label
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '16px',
          padding: '8px 12px',
          backgroundColor: 'var(--color-surface)',
          border: error
            ? '1px solid var(--color-error)'
            : focused
            ? '1px solid var(--color-accent)'
            : '1px solid var(--color-border)',
          borderRadius: 0,
          color: 'var(--color-text-primary)',
          outline: focused ? '1px solid var(--color-accent)' : 'none',
          width: '100%',
        }}
      />
      {error && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </span>
      )}
      {!error && helper && (
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {helper}
        </span>
      )}
    </div>
  )
}
