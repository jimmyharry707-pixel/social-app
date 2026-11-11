"use client";

import { useActionState } from "react";

import { updateProfile, type FormState } from "@/app/auth/actions";

type ProfileFormProps = {
  displayName: string;
  username: string;
  bio: string;
};

const initialState: FormState = {};

export function ProfileForm({ displayName, username, bio }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="auth-form profile-form">
      <label>
        Your name
        <input
          autoComplete="name"
          defaultValue={displayName}
          maxLength={60}
          name="displayName"
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
            defaultValue={username}
            maxLength={24}
            minLength={3}
            name="username"
            pattern="[a-zA-Z0-9_]{3,24}"
            required
          />
        </span>
      </label>
      <label>
        A little about you
        <textarea
          defaultValue={bio}
          maxLength={280}
          name="bio"
          placeholder="What are you into?"
          rows={4}
        />
        <span className="field-hint">Up to 280 characters.</span>
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.success && <p className="form-notice" role="status">{state.success}</p>}
      <button className="button button-dark auth-submit" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save profile"} {!pending && <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
