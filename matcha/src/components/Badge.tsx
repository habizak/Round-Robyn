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
        backgroundColor: accent ? '#1F9E78' : '#C8C2B4',
        color: accent ? '#F5F2EC' : '#6B6560',
      }}
    >
      {children}
    </span>
  )
}
