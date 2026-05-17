import type { ReactNode } from 'react'

type SetupScreenLayoutProps = {
  backButton?: ReactNode
  children: ReactNode
  footer: ReactNode
}

export function SetupScreenLayout({
  backButton,
  children,
  footer,
}: SetupScreenLayoutProps) {
  return (
    <div className="setup-screen">
      <main className="setup-screen__content">
        {backButton}
        {children}
      </main>
      <footer className="setup-screen__footer">
        {footer}
      </footer>
    </div>
  )
}
