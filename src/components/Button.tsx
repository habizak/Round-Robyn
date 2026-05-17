import React from 'react'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'onDark' | 'outline'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  pill?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  pill = false,
  type = 'button',
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    fontWeight: 500,
    padding: pill ? '14px 28px' : '12px 16px',
    borderRadius: pill ? 9999 : 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    width: fullWidth ? '100%' : undefined,
    display: 'inline-block',
    textAlign: 'center',
    transition: 'opacity 0.15s',
    lineHeight: '1.2',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-accent)',
      color: 'var(--color-reverse)',
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: 'none',
    },
    onDark: {
      backgroundColor: 'transparent',
      color: 'var(--color-reverse)',
      border: '1px solid var(--color-inactive)',
    },
    outline: {
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-text-primary)',
    },
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant] }}
    >
      {children}
    </button>
  )
}
