import { useEffect, useRef } from 'react'

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void
}

export default function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || initialized.current) return
    let resizeTimeout: ReturnType<typeof setTimeout>
    function computeWidth() {
      const containerWidth = buttonRef.current?.parentElement?.clientWidth ?? 280
      return Math.max(200, Math.min(280, containerWidth))
    }

    function render() {
      if (!window.google || !buttonRef.current) {
        setTimeout(render, 100)
        return
      }
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      })
      window.google!.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: computeWidth(),
      })
      initialized.current = true
    }

    render()
        function handleResize() {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(render, 200)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimeout)
    }
  }, [onCredential])

  return <div ref={buttonRef} />
}