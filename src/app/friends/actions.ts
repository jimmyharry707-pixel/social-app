"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    redirect("/auth/login");
  }

  return { supabase, userId: data.claims.sub };
}

function finish(status: string): never {
  revalidatePath("/friends");
  revalidatePath("/");
  redirect(`/friends?notice=${encodeURIComponent(status)}`);
}

export async function sendFriendRequest(formData: FormData) {
  const receiverId = formData.get("userId");
  if (typeof receiverId !== "string" || !uuidPattern.test(receiverId)) {
    finish("invalid-user");
  }

  const { supabase, userId } = await getCurrentUserId();
  if (receiverId === userId) {
    finish("invalid-user");
  }

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: userId,
    receiver_id: receiverId,
  });

  if (error) {
    finish(error.code === "23505" ? "already-pending" : "request-failed");
  }

  finish("request-sent");
}

export async function respondToFriendRequest(formData: FormData) {
  const requestId = formData.get("requestId");
  const response = formData.get("response");

  if (
    typeof requestId !== "string" ||
    !uuidPattern.test(requestId) ||
    (response !== "accepted" && response !== "declined")
  ) {
    finish("invalid-request");
  }

  const { supabase, userId } = await getCurrentUserId();
  const { data, error } = await supabase
    .from("friend_requests")
    .update({ status: response })
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    finish("request-unavailable");
  }

  finish(response === "accepted" ? "request-accepted" : "request-declined");
}

export async function cancelFriendRequest(formData: FormData) {
  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || !uuidPattern.test(requestId)) {
    finish("invalid-request");
  }

  const { supabase, userId } = await getCurrentUserId();
  const { data, error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("sender_id", userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    finish("request-unavailable");
  }

  finish("request-cancelled");
}
