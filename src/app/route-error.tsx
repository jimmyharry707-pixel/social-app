"use client";

import Link from "next/link";
import { useEffect } from "react";

type RouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
  title: string;
  homeHref?: string;
};

export function RouteError({
  error,
  retry,
  title,
  homeHref = "/",
}: RouteErrorProps) {
  useEffect(() => {
    console.error("Gather route error:", error);
  }, [error]);

  return (
    <main className="route-state-page">
      <section className="route-state-card" role="alert">
        <span className="route-state-mark" aria-hidden="true">✳</span>
        <p className="auth-eyebrow">A SMALL DETOUR</p>
        <h1>{title}</h1>
        <p>Something didn’t load as expected. Your account and content are safe. Please try again.</p>
        {error.digest && <p className="route-error-reference">Reference: {error.digest}</p>}
        <div className="route-state-actions">
          <button className="button button-dark" onClick={retry} type="button">Try again</button>
          <Link className="button button-muted" href={homeHref}>Go back</Link>
        </div>
      </section>
    </main>
  );
}
