import { LandingTopBar } from '@/components/shared/LandingTopBar'
import { Link } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
            <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />
      <LandingTopBar />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-4xl font-light tracking-tighter mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-foreground-secondary leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-foreground mb-2">What we collect</h2>
            <p>
              When you create an account, we collect your username, email address, and a
              securely hashed version of your password (we never store your password in
              plain text). If you sign in with Google, we receive your email address and
              a unique Google account identifier from Google, which we use to link your
              sign-in to your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-2">How we use it</h2>
            <p>
              We use your email to send account verification messages and, where relevant,
              notifications related to your working groups and projects. Your username and
              any project display names you set are visible to other members of the working
              groups and projects you belong to. We do not sell or share your data with
              third parties for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-2">Authentication data</h2>
            <p>
              We use JSON Web Tokens (JWTs) to keep you signed in. This token is stored in
              your browser and sent with requests to identify you — it does not contain
              your password. Signing in with Google is handled through Google's own
              authentication system; we never see or store your Google password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-2">Data retention and deletion</h2>
            <p>
              Your account data is retained for as long as your account exists. If you'd
              like your account and associated data deleted, contact us using the details
              below and we will remove it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-2">Third-party services</h2>
            <p>
              We use Google Sign-In for authentication, subject to{' '}
              
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              <a>
                Google's own privacy policy
              </a>
              . We use a standard email delivery provider to send verification emails.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-foreground mb-2">Contact</h2>
            <p>
              Questions about this policy or your data can be sent to{' '}
              <a href="mailto:twinchainstudios@google.com" className="underline hover:text-foreground">
                twinchainstudios@google.com
              </a>
              .
            </p>
          </section>
        </div>

        <Link to="/" className="inline-block mt-12 text-sm text-muted-foreground underline hover:text-foreground-secondary">
          Back to home
        </Link>
      </div>
    </div>
  )
}