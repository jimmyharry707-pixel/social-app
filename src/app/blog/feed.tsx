import Link from "next/link";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { PostLikeButton, type PostLikeSummary } from "./like-button";
import type { BlogPost, PostAuthor } from "./post-view";

const previewPosts: BlogPost[] = [
  {
    id: "preview-garden",
    author_id: "maya",
    title: "Making room for a little neighborhood garden",
    body: "Spent the morning sketching ideas for a tiny neighborhood garden. There’s something about starting with a blank page (and a very full coffee) that just feels right.",
    created_at: "2026-11-11T12:00:00.000Z",
    updated_at: "2026-11-11T12:00:00.000Z",
  },
  {
    id: "preview-next-step",
    author_id: "jordan",
    title: "A reminder to take the next small step",
    body: "You don’t have to have it all figured out to take the next small step. Here’s to giving ourselves permission to begin before we feel ready.",
    created_at: "2026-11-11T11:00:00.000Z",
    updated_at: "2026-11-11T11:00:00.000Z",
  },
];

const previewAuthors: Record<string, PostAuthor> = {
  maya: { user_id: "maya", username: "mayacreates", display_name: "Maya Chen" },
  jordan: { user_id: "jordan", username: "jordanlee", display_name: "Jordan Lee" },
};

function PostCard({
  post,
  author,
  isOwner,
  likeCount,
  liked,
}: {
  post: BlogPost;
  author: PostAuthor | null;
  isOwner: boolean;
  likeCount: number;
  liked: boolean;
}) {
  const authorName = author?.display_name ?? "Gather member";
  const initials = authorName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const createdAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(post.created_at));
  const isPreview = post.id.startsWith("preview-");

  return (
    <article className="post-card">
      <header className="post-header">
        <span className="avatar avatar-lavender" aria-hidden="true">{initials}</span>
        <div className="post-author">
          <span className="author-name">{authorName}</span>
          <span>{author ? `@${author.username} · ` : ""}{createdAt}</span>
        </div>
        {isOwner && (
          <Link className="button button-muted" href={`/blog/${post.id}/edit`}>Edit</Link>
        )}
      </header>
      {isPreview ? (
        <div className="feed-post-link">
          {post.title && <h3>{post.title}</h3>}
          <p>{post.body}</p>
        </div>
      ) : (
        <Link className="feed-post-link" href={`/blog/${post.id}`}>
          {post.title && <h3>{post.title}</h3>}
          <p>{post.body}</p>
          <span className="feed-post-read">Read story <span aria-hidden="true">→</span></span>
        </Link>
      )}
      {!isPreview && (
        <PostLikeButton count={likeCount} liked={liked} postId={post.id} />
      )}
    </article>
  );
}

export async function FeedPostList() {
  if (!getSupabaseEnv()) {
    return (
      <>
        <p className="preview-label">SAMPLE STORIES</p>
        <div className="post-list">
          {previewPosts.map((post) => (
            <PostCard
              author={previewAuthors[post.author_id]}
              isOwner={false}
              key={post.id}
              likeCount={0}
              liked={false}
              post={post}
            />
          ))}
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const currentUserId = claimsData?.claims.sub ?? null;

  if (claimsError) {
    throw new Error("Could not verify your session to load the feed.");
  }

  if (!currentUserId) {
    return (
      <div className="feed-empty">
        <p>Sign in to read posts from your friends.</p>
        <Link className="text-link" href="/auth/login">Sign in to Gather <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id,author_id,title,body,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (postsError) {
    throw new Error("Could not load the feed. Make sure the Supabase migrations are applied.");
  }

  const authorIds = [...new Set((posts ?? []).map((post) => post.author_id))];
  let authors: PostAuthor[] = [];

  if (authorIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,username,display_name")
      .in("user_id", authorIds);

    if (error) {
      throw new Error("Could not load post authors.");
    }

    authors = (data ?? []) as PostAuthor[];
  }

  const authorsById = new Map(authors.map((author) => [author.user_id, author]));

  if (!posts?.length) {
    return (
      <div className="feed-empty">
        <p>Your feed is quiet for now. Share a story or find a friend to get things started.</p>
        <Link className="text-link" href="/blog/new">Write your first post <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  const { data, error: likesError } = await supabase.rpc(
    "get_post_like_summaries",
    { p_post_ids: posts.map((post) => post.id) },
  );

  if (likesError) {
    throw new Error("Could not load post likes. Make sure the post likes migration has been applied.");
  }

  const likeSummaries = (data ?? []) as PostLikeSummary[];
  const likesByPostId = new Map(
    (likeSummaries ?? []).map((summary) => [summary.post_id, summary]),
  );

  return (
    <div className="post-list">
      {posts.map((post) => (
        <PostCard
          author={authorsById.get(post.author_id) ?? null}
          isOwner={post.author_id === currentUserId}
          key={post.id}
          likeCount={likesByPostId.get(post.id)?.like_count ?? 0}
          liked={likesByPostId.get(post.id)?.liked_by_me ?? false}
          post={post as BlogPost}
        />
      ))}
    </div>
  );
}
