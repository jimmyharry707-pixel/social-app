import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Messages — Gather",
};

type ConversationSummary = {
  conversation_id: string;
  friend_id: string;
  friend_username: string;
  friend_display_name: string;
  last_message: string | null;
  last_message_at: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function formatTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export default function MessagesPage() {
  if (!getSupabaseEnv()) {
    return (
      <main className="messages-page">
        <section className="messages-card-large messages-setup">
          <Link className="back-link" href="/">← Back to Gather</Link>
          <p className="auth-eyebrow">A NOTE FROM YOUR PEOPLE</p>
          <h1>Messages feel better in real time.</h1>
          <p>Connect your Supabase project and apply the database migrations to start chatting with friends.</p>
          <Link className="button button-dark profile-back-button" href="/auth/login">Sign in</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="messages-page">
      <Suspense fallback={<section className="messages-card-large messages-loading" />}>
        <ConversationList />
      </Suspense>
    </main>
  );
}

async function ConversationList() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase.rpc("get_my_conversations");

  if (error) {
    throw new Error("Could not load your conversations. Make sure the chat migration has been applied.");
  }

  const conversations = (data ?? []) as ConversationSummary[];

  return (
    <section className="messages-card-large">
      <header className="messages-page-header">
        <div>
          <Link className="back-link" href="/">← Back to Gather</Link>
          <p className="auth-eyebrow">A LITTLE SPACE JUST FOR YOU TWO</p>
          <h1>Your messages.</h1>
          <p>Good conversations make the day a little brighter.</p>
        </div>
        <Link className="button button-outline" href="/friends">Find a friend</Link>
      </header>

      {conversations.length === 0 ? (
        <div className="messages-empty">
          <span aria-hidden="true">✳</span>
          <h2>No conversations yet.</h2>
          <p>Once you’re friends, you can start a private conversation here.</p>
          <Link className="button button-dark" href="/friends">Find your people</Link>
        </div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conversation) => (
            <Link
              className="conversation-list-row"
              href={`/messages/${conversation.conversation_id}`}
              key={conversation.conversation_id}
            >
              <span className="avatar avatar-lavender" aria-hidden="true">
                {initials(conversation.friend_display_name)}
              </span>
              <span className="conversation-list-person">
                <strong>{conversation.friend_display_name}</strong>
                <span>
                  {conversation.last_message ?? `Start a conversation with @${conversation.friend_username}`}
                </span>
              </span>
              <time>{formatTime(conversation.last_message_at)}</time>
              <span className="conversation-list-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
