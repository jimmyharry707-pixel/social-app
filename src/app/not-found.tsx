import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-state-page">
      <section className="route-state-card">
        <span className="route-state-mark" aria-hidden="true">✳</span>
        <p className="auth-eyebrow">NOT HERE, NOT TODAY</p>
        <h1>We couldn’t find that page.</h1>
        <p>The link may be old, or the page may have moved.</p>
        <div className="route-state-actions">
          <Link className="button button-dark" href="/">Back to Gather</Link>
        </div>
      </section>
    </main>
  );
}
