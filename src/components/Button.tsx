import React from 'react'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline-pill' | 'onDark' | 'outline'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'md'
  /** @deprecated use variant="outline-pill" instead */
  pill?: boolean
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
  size = 'md',
  pill = false,
}: ButtonProps) {
  const isGhost = variant === 'ghost'
  // Pill shape: always for non-ghost, also if pill prop is set
  const isPill = !isGhost || pill

  const baseStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: size === 'sm' ? '13px' : '14px',
    fontWeight: 500,
    padding: size === 'sm' ? '10px 20px' : '14px 28px',
    borderRadius: isPill ? '9999px' : undefined,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    width: fullWidth ? '100%' : undefined,
    display: 'inline-block',
    textAlign: 'center',
    transition: 'opacity 0.15s',
    lineHeight: '1.2',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#FE680C',
      color: 'white',
      border: 'none',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#3c3c3c',
      border: '1.5px solid #3c3c3c',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#3c3c3c',
      border: 'none',
    },
    'outline-pill': {
      backgroundColor: 'transparent',
      color: '#3c3c3c',
      border: '1.5px solid #dcdcdc',
    },
    // backward-compat aliases
    onDark: {
      backgroundColor: 'transparent',
      color: 'white',
      border: '1.5px solid rgba(255,255,255,0.4)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#3c3c3c',
      border: '1.5px solid #3c3c3c',
    },
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...(variantStyles[variant] ?? variantStyles['ghost']) }}
    >
      {children}
    </button>
  )
}
