"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signIn, signUp, type FormState } from "./actions";

type AuthFormProps = {
  mode: "login" | "signup";
  configured: boolean;
  checkEmail?: boolean;
  confirmationError?: boolean;
};

const initialState: FormState = {};

export function AuthForm({
  mode,
  configured,
  checkEmail = false,
  confirmationError = false,
}: AuthFormProps) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignup = mode === "signup";

  return (
    <div className="auth-card">
      <Link href="/" className="auth-brand" aria-label="Gather home">
        <span className="wordmark-icon" aria-hidden="true">g</span>
        gather
      </Link>
      <p className="auth-eyebrow">{isSignup ? "YOUR PEOPLE ARE HERE" : "WELCOME BACK"}</p>
      <h1>{isSignup ? "Make yourself at home." : "Good to see you again."}</h1>
      <p className="auth-intro">
        {isSignup
          ? "Create your account and start gathering your people."
          : "Sign in and catch up with your people."}
      </p>

      {checkEmail && (
        <p className="form-notice" role="status">
          Check your inbox for a confirmation link. Once you confirm your email, you can sign in.
        </p>
      )}
      {confirmationError && (
        <p className="form-error" role="alert">
          That confirmation link is invalid or expired. Request a new one by creating an account again.
        </p>
      )}
      {!configured && (
        <p className="form-notice" role="status">
          Supabase isn’t connected yet. Add your project URL and publishable key to <code>.env.local</code>, then restart the app.
        </p>
      )}

      <form action={formAction} className="auth-form">
        {isSignup && (
          <>
            <label>
              Your name
              <input
                autoComplete="name"
                maxLength={60}
                name="displayName"
                placeholder="Sam Kim"
                required
              />
            </label>
            <label>
              Username
              <span className="username-input">
                <span aria-hidden="true">@</span>
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  maxLength={24}
                  minLength={3}
                  name="username"
                  pattern="[a-zA-Z0-9_]{3,24}"
                  placeholder="yourname"
                  required
                />
              </span>
              <span className="field-hint">3–24 letters, numbers, or underscores.</span>
            </label>
          </>
        )}
        <label>
          Email
          <input
            autoCapitalize="none"
            autoComplete="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label>
          Password
          <input
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={8}
            name="password"
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            required
            type="password"
          />
        </label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="button button-dark auth-submit" disabled={!configured || pending} type="submit">
          {pending ? "One moment…" : isSignup ? "Create your account" : "Sign in"}
          {!pending && <span aria-hidden="true">→</span>}
        </button>
      </form>

      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to Gather?"}{" "}
        <Link href={isSignup ? "/auth/login" : "/auth/signup"}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
      <Link className="auth-home-link" href="/">← Back to Gather</Link>
    </div>
  );
}
