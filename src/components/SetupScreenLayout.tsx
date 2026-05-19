import { type ReactNode, useEffect, useRef } from 'react'

type SetupScreenLayoutProps = {
  backButton?: ReactNode
  children: ReactNode
  footer: ReactNode
}

export function SetupScreenLayout({ backButton, children, footer }: SetupScreenLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function handleResize() {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv!.height}px`
      }
    }

    vv.addEventListener('resize', handleResize)
    handleResize()

    return () => vv.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="setup-screen" ref={containerRef}>
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
