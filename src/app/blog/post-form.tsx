"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createPost,
  updatePost,
  type PostFormState,
} from "./actions";

type PostFormProps = {
  mode: "create" | "edit";
  postId?: string;
  initialTitle?: string;
  initialBody?: string;
};

const initialState: PostFormState = {};

export function PostForm({
  mode,
  postId,
  initialTitle = "",
  initialBody = "",
}: PostFormProps) {
  const action = mode === "create" ? createPost : updatePost;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="post-editor-form">
      {postId && <input name="postId" type="hidden" value={postId} />}
      <label>
        Title
        <input
          autoFocus
          defaultValue={initialTitle}
          maxLength={120}
          name="title"
          placeholder="Give your story a title"
          required
        />
      </label>
      <label>
        Your story
        <textarea
          defaultValue={initialBody}
          maxLength={5000}
          name="body"
          placeholder="Write what’s on your mind..."
          required
          rows={12}
        />
        <span className="field-hint">Up to 5,000 characters.</span>
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <div className="post-editor-actions">
        <Link className="button button-muted" href={mode === "edit" && postId ? `/blog/${postId}` : "/"}>
          Cancel
        </Link>
        <button className="button button-dark" disabled={pending} type="submit">
          {pending ? "Saving…" : mode === "create" ? "Publish post" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
