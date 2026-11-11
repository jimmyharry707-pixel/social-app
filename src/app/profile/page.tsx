import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { ProfileForm } from "./profile-form";

export default function ProfilePage() {
  if (!getSupabaseEnv()) {
    return (
      <main className="profile-page">
        <section className="profile-card">
          <Link className="back-link" href="/">← Back to Gather</Link>
          <h1>Connect Supabase first.</h1>
          <p>Set the project URL and publishable key in <code>.env.local</code> to create and edit your profile.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <Suspense fallback={<section className="profile-card profile-card-loading" />}>
        <ProfileEditor />
      </Suspense>
    </main>
  );
}

async function ProfileEditor() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio")
    .eq("user_id", claimsData.claims.sub)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load your profile. Please try again.");
  }

  if (!profile) {
    return (
      <section className="profile-card">
        <Link className="back-link" href="/">← Back to Gather</Link>
        <p className="auth-eyebrow">ONE LAST THING</p>
        <h1>Finish your profile.</h1>
        <p>Your profile is still being set up. If you just confirmed your email, try signing in again in a moment.</p>
        <Link className="button button-dark profile-back-button" href="/">Back to home</Link>
      </section>
    );
  }

  return (
    <section className="profile-card">
      <Link className="back-link" href="/">← Back to Gather</Link>
      <p className="auth-eyebrow">YOUR LITTLE CORNER</p>
      <h1>Your profile.</h1>
      <p className="auth-intro">This is how you’ll show up to your people.</p>
      <ProfileForm
        bio={profile.bio}
        displayName={profile.display_name}
        username={profile.username}
      />
    </section>
  );
}
