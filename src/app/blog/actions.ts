"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type PostFormState = {
  error?: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validate(title: string, body: string): PostFormState | null {
  if (title.length < 1 || title.length > 120) {
    return { error: "Your title must be between 1 and 120 characters." };
  }
  if (body.length < 1 || body.length > 5000) {
    return { error: "Your post must be between 1 and 5,000 characters." };
  }
  return null;
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (error || !userId) {
    redirect("/auth/login");
  }

  return { supabase, userId };
}

function refreshBlogPaths(postId?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  if (postId) {
    revalidatePath(`/blog/${postId}`);
    revalidatePath(`/blog/${postId}/edit`);
  }
}

export async function setPostLike(formData: FormData) {
  const postId = getString(formData, "postId");
  const shouldLike = getString(formData, "liked");

  if (!uuidPattern.test(postId) || !["true", "false"].includes(shouldLike)) {
    throw new Error("This post like request is invalid.");
  }

  const { supabase, userId } = await getAuthenticatedClient();
  const result =
    shouldLike === "true"
      ? await supabase
          .from("post_likes")
          .upsert(
            { post_id: postId, user_id: userId },
            { onConflict: "post_id,user_id", ignoreDuplicates: true },
          )
      : await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

  if (result.error) {
    throw new Error("Could not update your like. Make sure the post likes migration has been applied.");
  }

  revalidatePath("/");
  revalidatePath(`/blog/${postId}`);
}

export async function createPost(
  _previousState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const validation = validate(title, body);

  if (validation) {
    return validation;
  }

  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: userId, title, body })
    .select("id")
    .single();

  if (error) {
    throw new Error("Could not publish your post. Please try again.");
  }

  refreshBlogPaths(data.id);
  redirect(`/blog/${data.id}`);
}

export async function updatePost(
  _previousState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const postId = getString(formData, "postId");
  const title = getString(formData, "title");
  const body = getString(formData, "body");

  if (!uuidPattern.test(postId)) {
    return { error: "This post could not be found." };
  }

  const validation = validate(title, body);
  if (validation) {
    return validation;
  }

  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("posts")
    .update({ title, body })
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { error: "We couldn’t update this post. Make sure it’s yours and try again." };
  }

  refreshBlogPaths(data.id);
  redirect(`/blog/${data.id}`);
}

export async function deletePost(formData: FormData) {
  const postId = getString(formData, "postId");
  if (!uuidPattern.test(postId)) {
    throw new Error("This post could not be found.");
  }

  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("We couldn’t delete this post. Make sure it’s yours and try again.");
  }

  refreshBlogPaths();
  redirect("/");
}
