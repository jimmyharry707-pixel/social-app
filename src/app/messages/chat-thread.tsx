"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

import { sendMessage, type MessageFormState } from "./actions";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const initialState: MessageFormState = {};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const [realtimeMessages, setRealtimeMessages] = useState(initialMessages);
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING");
  const [state, formAction, pending] = useActionState(sendMessage, initialState);
  const messageListRef = useRef<HTMLDivElement>(null);
  const sentMessage = state.message;
  const messages =
    sentMessage?.conversation_id === conversationId &&
    !realtimeMessages.some((message) => message.id === sentMessage.id)
      ? [...realtimeMessages, sentMessage].sort(
          (first, second) =>
            new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
        )
      : realtimeMessages;

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as ChatMessage;
          if (message.conversation_id !== conversationId) {
            return;
          }

          setRealtimeMessages((currentMessages) => {
            if (currentMessages.some((existing) => existing.id === message.id)) {
              return currentMessages;
            }

            return [...currentMessages, message].sort(
              (first, second) =>
                new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
            );
          });
        },
      )
      .subscribe((status) => {
        if (!cancelled) {
          setRealtimeStatus(status);
        }
      });

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    const list = messageListRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <div
        aria-live="polite"
        className={`chat-connection chat-connection-${realtimeStatus.toLowerCase()}`}
        role={
          realtimeStatus === "CHANNEL_ERROR" ||
          realtimeStatus === "TIMED_OUT" ||
          realtimeStatus === "CLOSED"
            ? "alert"
            : "status"
        }
      >
        <span aria-hidden="true" />
        {realtimeStatus === "SUBSCRIBED"
          ? "Live updates on"
          : realtimeStatus === "CHANNEL_ERROR" ||
              realtimeStatus === "TIMED_OUT" ||
              realtimeStatus === "CLOSED"
            ? "Live updates unavailable. Refresh to reconnect."
            : "Connecting to live updates…"}
      </div>

      <div
        aria-label="Conversation messages"
        aria-live="polite"
        aria-relevant="additions"
        className="chat-message-list"
        ref={messageListRef}
        role="log"
      >
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span aria-hidden="true">✳</span>
            <p>This is the start of your conversation.</p>
            <span>Say hello to your friend.</span>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === currentUserId;

            return (
              <article
                className={`chat-message ${isOwnMessage ? "chat-message-own" : ""}`}
                key={message.id}
              >
                <p>{message.body}</p>
                <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
              </article>
            );
          })
        )}
      </div>

      <form action={formAction} className="chat-composer">
        <input name="conversationId" type="hidden" value={conversationId} />
        <label className="visually-hidden" htmlFor="chat-message">Write a message</label>
        <textarea
          autoComplete="off"
          disabled={pending}
          id="chat-message"
          maxLength={4000}
          name="body"
          placeholder="Write a message…"
          required
          rows={1}
        />
        <button className="button button-dark" disabled={pending} type="submit">
          {pending ? "Sending…" : "Send"} <span aria-hidden="true">↗</span>
        </button>
      </form>
      {state.error && <p className="form-error chat-error" role="alert">{state.error}</p>}
    </>
  );
}
