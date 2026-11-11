import Link from "next/link";
import { Suspense } from "react";

import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export function AccountMenu() {
  if (!getSupabaseEnv()) {
    return (
      <>
        <Link className="account-link" href="/auth/login">Sign in</Link>
        <Link className="button button-dark account-join" href="/auth/signup">Join Gather</Link>
      </>
    );
  }

  return (
    <Suspense fallback={<span className="account-loading" aria-hidden="true" />}>
      <SignedInAccount />
    </Suspense>
  );
}

async function SignedInAccount() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || !userId) {
    return (
      <>
        <Link className="account-link" href="/auth/login">Sign in</Link>
        <Link className="button button-dark account-join" href="/auth/signup">Join Gather</Link>
      </>
    );
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load your profile.");
  }

  if (!profile) {
    return (
      <>
        <Link className="account-link" href="/profile">Finish profile</Link>
        <form action={signOut}>
          <button className="account-link" type="submit">Sign out</button>
        </form>
      </>
    );
  }

  const initials = profile.display_name
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <>
      <Link className="account-chip" href="/profile">
        <span className="avatar avatar-lavender avatar-small" aria-hidden="true">
          {initials}
        </span>
        <span>{profile.display_name}</span>
        <span className="chevron" aria-hidden="true">⌄</span>
      </Link>
      <form action={signOut}>
        <button className="account-signout" type="submit">Sign out</button>
      </form>
    </>
  );
}
