"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type MessageFormState = {
  error?: string;
  message?: {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  };
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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

export async function startConversation(formData: FormData) {
  const friendId = getString(formData, "friendId");
  if (!uuidPattern.test(friendId)) {
    redirect("/friends?notice=invalid-user");
  }

  const { supabase } = await getAuthenticatedClient();
  const { data, error } = await supabase.rpc("create_direct_conversation", {
    p_friend_id: friendId,
  });

  if (error || !data) {
    redirect("/friends?notice=conversation-failed");
  }

  redirect(`/messages/${data}`);
}

export async function sendMessage(
  _previousState: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const conversationId = getString(formData, "conversationId");
  const body = getString(formData, "body");

  if (!uuidPattern.test(conversationId)) {
    return { error: "This conversation could not be found.", message: _previousState.message };
  }
  if (body.length < 1 || body.length > 4000) {
    return {
      error: "Messages must be between 1 and 4,000 characters.",
      message: _previousState.message,
    };
  }

  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
    })
    .select("id,conversation_id,sender_id,body,created_at")
    .single();

  if (error) {
    return {
      error: "Your message couldn’t be sent. Please try again.",
      message: _previousState.message,
    };
  }

  return { message: data };
}
