import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PostForm } from "../post-form";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Write a post — Gather",
};

export default function NewPostPage() {
  if (!getSupabaseEnv()) {
    return (
      <main className="blog-page">
        <section className="blog-editor-card">
          <Link className="back-link" href="/">← Back to Gather</Link>
          <h1>Connect Supabase to publish.</h1>
          <p>Configure your Supabase project and apply the database migrations to share a post.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="blog-page">
      <Suspense fallback={<section className="blog-editor-card blog-editor-loading" />}>
        <NewPostEditor />
      </Suspense>
    </main>
  );
}

async function NewPostEditor() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", data.claims.sub)
    .maybeSingle();

  if (profileError) {
    throw new Error("Could not load your profile.");
  }

  return (
    <section className="blog-editor-card">
      <Link className="back-link" href="/">← Back to your feed</Link>
      <p className="auth-eyebrow">A LITTLE STORY OF YOUR OWN</p>
      <h1>Write a post.</h1>
      <p className="auth-intro">
        {profile ? `Share what’s on your mind, ${profile.display_name}.` : "Share what’s on your mind."}
      </p>
      <PostForm mode="create" />
    </section>
  );
}
