import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getMe, resendVerification } from '@api/account/authAPI'
import { Button } from '@components/shared/ui/button'

export function VerifyEmailBanner() {
  const [status, setStatus] = useState<{ emailVerified: boolean; localCredentialsPending: boolean } | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getMe().then(setStatus).catch(() => { })
  }, [])

  if (!status) return null
  const needsVerification = !status.emailVerified
  if (!needsVerification) return null

  async function handleResend() {
    setSending(true)
    try {
      await resendVerification()
      toast.success('Verification email sent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send verification email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
      <span>
        {status.localCredentialsPending
          ? 'Verify your email to finish setting up password login for this account.'
          : 'Your email is not verified yet.'}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleResend}
        disabled={sending}
        className="    
   
  border-warning/40
  bg-warning/40
  text-foreground
  hover:bg-warning/80
  dark:bg-warning/40
  dark:hover:bg-warning/80

    
  "
      >
        {sending ? 'Sending...' : 'Verify Email'}
      </Button>
    </div>
  )
}