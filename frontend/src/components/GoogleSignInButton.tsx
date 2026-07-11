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

    function tryRender() {
      if (!window.google || !buttonRef.current) {
        setTimeout(tryRender, 100)
        return
      }
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      })
      window.google!.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 280,
      })
      initialized.current = true
    }

    tryRender()
  }, [onCredential])

  return <div ref={buttonRef} />
}