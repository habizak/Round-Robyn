import React from 'react'

type BadgeProps = {
  children: React.ReactNode
  accent?: boolean
}

export function Badge({ children, accent }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '9999px',
        padding: '2px 10px',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        backgroundColor: accent ? 'var(--color-accent)' : 'var(--color-border)',
        color: accent ? 'var(--color-reverse)' : 'var(--color-text-primary)',
      }}
    >
      {children}
    </span>
  )
}
