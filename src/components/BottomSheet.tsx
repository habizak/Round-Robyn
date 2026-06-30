import React, { useEffect } from 'react'

type BottomSheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(60,60,60,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        style={{
          backgroundColor: 'var(--color-bg)',
          borderTop: '1.5px solid var(--color-border)',
          borderRadius: '16px 16px 0 0',
          maxWidth: '420px',
          width: '100%',
          maxHeight: '50dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: '12px 24px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-border)',
              marginBottom: '12px',
            }}
          />
          {title && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span
                id="bottom-sheet-title"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {title}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '18px',
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '0 24px 16px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              flexShrink: 0,
              padding: '12px 24px calc(12px + env(safe-area-inset-bottom))',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
