import { Link } from 'react-router-dom'
import { TopBar } from '../components/TopBar'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <TopBar />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-heading text-4xl font-light tracking-tighter mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-medium text-zinc-50 mb-2">Using OurKanban</h2>
            <p>
              OurKanban is a collaborative project and task management tool. By creating an
              account, you agree to use it responsibly and not to misuse it — including
              attempting to access accounts, working groups, or projects you're not a
              member of, or using the service to store or share unlawful content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-zinc-50 mb-2">Your account</h2>
            <p>
              You're responsible for keeping your login credentials secure. If you believe
              your account has been compromised, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-zinc-50 mb-2">Your content</h2>
            <p>
              Any working groups, projects, and tasks you create remain yours. We don't
              claim ownership over your content — we only store and display it so the
              service can function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-zinc-50 mb-2">Availability</h2>
            <p>
              This is an actively developed project. We aim to keep the service available
              and your data safe, but we don't guarantee uninterrupted uptime, and features
              may change as the app evolves.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-zinc-50 mb-2">Termination</h2>
            <p>
              You may stop using the service and request account deletion at any time. We
              reserve the right to suspend accounts that violate these terms or misuse the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-zinc-50 mb-2">Contact</h2>
            <p>
              Questions about these terms can be sent to{' '}
              <a href="mailto:twinchainstudios@google.com" className="underline hover:text-zinc-50">
                twinchainstudios@google.com
              </a>
              .
            </p>
          </section>
        </div>

        <Link to="/" className="inline-block mt-12 text-sm text-zinc-500 underline hover:text-zinc-200">
          Back to home
        </Link>
      </div>
    </div>
  )
}