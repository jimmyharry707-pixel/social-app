import { setPostLike } from "./actions";

export type PostLikeSummary = {
  post_id: string;
  like_count: number;
  liked_by_me: boolean;
};

export function PostLikeButton({
  postId,
  count,
  liked,
}: {
  postId: string;
  count: number;
  liked: boolean;
}) {
  return (
    <form action={setPostLike} className="post-like-form">
      <input name="postId" type="hidden" value={postId} />
      <input name="liked" type="hidden" value={liked ? "false" : "true"} />
      <button
        aria-label={`${liked ? "Unlike" : "Like"} post; ${count} ${count === 1 ? "like" : "likes"}`}
        aria-pressed={liked}
        className={`post-like-button${liked ? " post-like-button-active" : ""}`}
        type="submit"
      >
        <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
        <span>{liked ? "Liked" : "Like"}</span>
        <span className="post-like-count">{count}</span>
      </button>
    </form>
  );
}
