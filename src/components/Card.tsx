import React from 'react'

type CardProps = {
  children: React.ReactNode
  dark?: boolean
  dashed?: boolean
  selected?: boolean
  onClick?: () => void
}

export function Card({ children, dark, dashed, selected, onClick }: CardProps) {
  const style: React.CSSProperties = {
    backgroundColor: dark ? '#1A1A18' : 'var(--color-surface)',
    color: dark ? '#F5F2EC' : 'var(--color-text-primary)',
    border: selected
      ? `2px solid var(--color-accent)`
      : dashed
      ? `1px dashed var(--color-border)`
      : `1px solid var(--color-border)`,
    borderLeft: selected ? '2px solid var(--color-accent)' : undefined,
    padding: '16px',
    borderRadius: 0,
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
