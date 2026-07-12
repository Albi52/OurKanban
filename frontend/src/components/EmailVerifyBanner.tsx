import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getMe, resendVerification } from '../api/authAPI'
import { Button } from '../components/ui/button'

export function VerifyEmailBanner() {
  const [status, setStatus] = useState<{ emailVerified: boolean; localCredentialsPending: boolean } | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getMe().then(setStatus).catch(() => {})
  }, [])

  if (!status) return null
  const needsVerification = !status.emailVerified || status.localCredentialsPending
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
    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <span>
        {status.localCredentialsPending
          ? 'Verify your email to finish setting up password login for this account.'
          : 'Your email is not verified yet.'}
      </span>
      <Button size="sm" variant="outline" onClick={handleResend} disabled={sending}
        className="border-amber-500/40 text-amber-200 hover:bg-amber-500/20">
        {sending ? 'Sending...' : 'Verify Email'}
      </Button>
    </div>
  )
}