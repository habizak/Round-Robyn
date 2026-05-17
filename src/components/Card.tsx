import React from 'react'

type CardProps = {
  children: React.ReactNode
  dark?: boolean
  dashed?: boolean
  dashedAccent?: boolean
  selected?: boolean
  rounded?: boolean
  onClick?: () => void
}

export function Card({ children, dark, dashed, dashedAccent, selected, rounded, onClick }: CardProps) {
  const style: React.CSSProperties = {
    backgroundColor: dark
      ? 'var(--color-card)'
      : selected
        ? 'var(--color-accent)'
        : 'transparent',
    color: dark
      ? 'var(--color-reverse)'
      : selected
        ? 'var(--color-reverse)'
        : 'var(--color-text-primary)',
    border: selected
      ? `2px solid var(--color-accent)`
      : dashedAccent
      ? `1px dashed var(--color-accent)`
      : dashed
      ? `1px dashed var(--color-border)`
      : `1px solid var(--color-border)`,
    padding: '16px',
    borderRadius: rounded ? 16 : 0,
    cursor: onClick ? 'pointer' : undefined,
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div style={style} onClick={onClick}>
      {children}
    </div>
  )
}
