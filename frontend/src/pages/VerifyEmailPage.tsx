import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { apiGet } from '../api/client'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const hasFired = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token')
      return
    }
    if (hasFired.current) return
    hasFired.current = true

    apiGet<{ message: string }>(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus('success')
        setMessage(res.message)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center gap-4">
      {status === 'loading' && <p>Verifying...</p>}
      {status === 'success' && <p className="text-emerald-400">{message}</p>}
      {status === 'error' && <p className="text-red-400">{message}</p>}
      <Link to="/login" className="underline text-zinc-400 hover:text-zinc-50">Back to sign in</Link>
    </div>
  )
}