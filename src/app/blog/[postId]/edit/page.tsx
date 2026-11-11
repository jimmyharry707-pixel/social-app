import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PostForm } from "../../post-form";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Edit post — Gather",
};

type EditParams = PageProps<"/blog/[postId]/edit">["params"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function EditPostPage(props: PageProps<"/blog/[postId]/edit">) {
  if (!getSupabaseEnv()) {
    return (
      <main className="blog-page">
        <section className="blog-editor-card">
          <Link className="back-link" href="/">← Back to Gather</Link>
          <h1>Posts aren’t connected yet.</h1>
          <p>Configure Supabase and apply the migrations to edit posts.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="blog-page">
      <Suspense fallback={<section className="blog-editor-card blog-editor-loading" />}>
        <EditPostEditor params={props.params} />
      </Suspense>
    </main>
  );
}

async function EditPostEditor({ params }: { params: EditParams }) {
  const { postId } = await params;
  if (!uuidPattern.test(postId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    redirect("/auth/login");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .select("id,author_id,title,body")
    .eq("id", postId)
    .eq("author_id", claimsData.claims.sub)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load this post.");
  }
  if (!post) {
    notFound();
  }

  return (
    <section className="blog-editor-card">
      <Link className="back-link" href={`/blog/${post.id}`}>← Back to post</Link>
      <p className="auth-eyebrow">TIDY UP YOUR THOUGHTS</p>
      <h1>Edit your post.</h1>
      <PostForm
        initialBody={post.body}
        initialTitle={post.title ?? ""}
        mode="edit"
        postId={post.id}
      />
    </section>
  );
}
