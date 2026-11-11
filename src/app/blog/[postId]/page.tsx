import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { PostArticle, type BlogPost, type PostAuthor } from "../post-view";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Post — Gather",
};

type PostParams = PageProps<"/blog/[postId]">["params"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PostPage(props: PageProps<"/blog/[postId]">) {
  if (!getSupabaseEnv()) {
    return (
      <main className="blog-page">
        <section className="blog-editor-card">
          <Link className="back-link" href="/">← Back to Gather</Link>
          <h1>Posts aren’t connected yet.</h1>
          <p>Configure Supabase and apply the migrations to read and publish posts.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="blog-page">
      <Suspense fallback={<section className="blog-editor-card blog-editor-loading" />}>
        <PostContent params={props.params} />
      </Suspense>
    </main>
  );
}

async function PostContent({ params }: { params: PostParams }) {
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
    .select("id,author_id,title,body,created_at,updated_at")
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load this post.");
  }
  if (!post) {
    notFound();
  }

  const { data: author, error: authorError } = await supabase
    .from("profiles")
    .select("user_id,username,display_name")
    .eq("user_id", post.author_id)
    .maybeSingle();

  if (authorError) {
    throw new Error("Could not load the post author.");
  }

  return (
    <div className="blog-content">
      <Link className="back-link" href="/">← Back to your feed</Link>
      <PostArticle
        author={author as PostAuthor | null}
        currentUserId={claimsData.claims.sub}
        post={post as BlogPost}
      />
    </div>
  );
}
