import React from 'react'

type CardProps = {
  children: React.ReactNode
  dark?: boolean
  dashed?: boolean
  /** @deprecated use dashed instead, kept for compat */
  dashedAccent?: boolean
  selected?: boolean
  onClick?: () => void
  padding?: number
  /** @deprecated border-radius is always 12px, kept for compat */
  rounded?: boolean
}

export function Card({ children, dark, dashed, dashedAccent, selected, onClick, padding = 16 }: CardProps) {
  const isDashed = dashed || dashedAccent

  const style: React.CSSProperties = {
    backgroundColor: dark ? '#3c3c3c' : isDashed ? 'var(--color-bg)' : 'var(--color-surface)',
    color: dark ? 'white' : 'var(--color-text-primary)',
    border: selected
      ? '2px solid #FE680C'
      : isDashed
      ? '2px dashed #FE680C'
      : '1.5px solid var(--color-border)',
    borderRadius: '12px',
    padding: `${padding}px`,
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
