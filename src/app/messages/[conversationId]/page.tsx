import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { ChatThread, type ChatMessage } from "../chat-thread";

export const metadata: Metadata = {
  title: "Conversation — Gather",
};

type ChatParams = PageProps<"/messages/[conversationId]">["params"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ConversationPage(props: PageProps<"/messages/[conversationId]">) {
  if (!getSupabaseEnv()) {
    return (
      <main className="messages-page">
        <section className="messages-card-large messages-setup">
          <Link className="back-link" href="/messages">← Back to messages</Link>
          <h1>Connect Supabase to chat.</h1>
          <p>Configure your project and apply the migrations to start messaging.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="messages-page">
      <Suspense fallback={<section className="chat-card chat-card-loading" />}>
        <Conversation params={props.params} />
      </Suspense>
    </main>
  );
}

async function Conversation({ params }: { params: ChatParams }) {
  const { conversationId } = await params;
  if (!uuidPattern.test(conversationId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    redirect("/auth/login");
  }

  const currentUserId = claimsData.claims.sub;
  const { data: membership, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (membershipError) {
    throw new Error("Could not verify access to this conversation.");
  }
  if (!membership) {
    notFound();
  }

  const { data: otherMember, error: otherMemberError } = await supabase
    .from("conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", currentUserId)
    .maybeSingle();

  if (otherMemberError) {
    throw new Error("Could not load the conversation participant.");
  }
  if (!otherMember) {
    notFound();
  }

  const [profileResult, messageResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username,display_name")
      .eq("user_id", otherMember.user_id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id,conversation_id,sender_id,body,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (profileResult.error || messageResult.error) {
    throw new Error("Could not load this conversation.");
  }
  if (!profileResult.data) {
    notFound();
  }

  const messages = ((messageResult.data ?? []) as ChatMessage[]).reverse();

  return (
    <section className="chat-card">
      <header className="chat-header">
        <Link className="chat-back" href="/messages" aria-label="Back to messages">←</Link>
        <span className="avatar avatar-lavender" aria-hidden="true">
          {profileResult.data.display_name
            .split(/\s+/)
            .slice(0, 2)
            .map((part: string) => part.charAt(0))
            .join("")
            .toUpperCase()}
        </span>
        <span className="chat-header-person">
          <strong>{profileResult.data.display_name}</strong>
          <span>@{profileResult.data.username}</span>
        </span>
        <span className="chat-header-note">Just between friends</span>
      </header>
      <ChatThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={messages}
      />
    </section>
  );
}
