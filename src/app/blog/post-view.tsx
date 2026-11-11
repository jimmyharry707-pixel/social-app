import Link from "next/link";

import { deletePost } from "./actions";
import { PostLikeButton } from "./like-button";

export type BlogPost = {
  id: string;
  author_id: string;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

export type PostAuthor = {
  user_id: string;
  username: string;
  display_name: string;
};

export function PostArticle({
  post,
  author,
  currentUserId,
  likeCount,
  liked,
}: {
  post: BlogPost;
  author: PostAuthor | null;
  currentUserId: string | null;
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
  const isOwner = currentUserId === post.author_id;

  return (
    <article className="post-card blog-post-card">
      <header className="post-header">
        <span className="avatar avatar-lavender" aria-hidden="true">{initials}</span>
        <div className="post-author">
          <span className="author-name">{authorName}</span>
          <span>{author ? `@${author.username} · ` : ""}{createdAt}</span>
        </div>
        {isOwner && (
          <div className="post-owner-actions">
            <Link className="button button-muted" href={`/blog/${post.id}/edit`}>Edit</Link>
            <form action={deletePost}>
              <input name="postId" type="hidden" value={post.id} />
              <button className="button button-danger" type="submit">Delete</button>
            </form>
          </div>
        )}
      </header>
      {post.title && <h2 className="blog-post-title">{post.title}</h2>}
      <div className="blog-post-body">{post.body}</div>
      <footer className="blog-post-footer">
        <PostLikeButton count={likeCount} liked={liked} postId={post.id} />
        <Link className="text-link" href="/">← Back to your feed</Link>
        {post.updated_at !== post.created_at && <span>Edited</span>}
      </footer>
    </article>
  );
}
