import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1>OurKanban</h1>
      <p>Plan, organize, and move work forward — together, in real time.</p>
      <Link to="/login">
        <button style={{ padding: '0.6rem 1.4rem', fontSize: '1rem' }}>
          Log in
        </button>
      </Link>
    </div>
  )
}