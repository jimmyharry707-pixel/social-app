import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  cancelFriendRequest,
  respondToFriendRequest,
  sendFriendRequest,
} from "./actions";
import { startConversation } from "@/app/messages/actions";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Friends — Gather",
};

type FriendsSearchParams = PageProps<"/friends">["searchParams"];
type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
};
type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

const noticeText: Record<string, string> = {
  "request-sent": "Friend request sent.",
  "request-accepted": "You’re friends now.",
  "request-declined": "Request declined.",
  "request-cancelled": "Friend request cancelled.",
  "already-pending": "There’s already a pending request between you.",
  "request-unavailable": "That request is no longer available.",
  "invalid-user": "That user could not be found.",
  "invalid-request": "That request could not be found.",
  "request-failed": "We couldn’t send that request. Please try again.",
  "conversation-failed": "We couldn’t start a chat. Make sure you’re friends and try again.",
};

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function cleanSearch(value: string) {
  return value
    .replace(/[^\p{L}\p{N}_ .'-]/gu, "")
    .trim()
    .slice(0, 40);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return <span className="avatar avatar-lavender" aria-hidden="true">{initials(name)}</span>;
}

export default function FriendsPage(props: PageProps<"/friends">) {
  if (!getSupabaseEnv()) {
    return (
      <main className="friends-page">
        <section className="friends-card friends-setup">
          <Link className="back-link" href="/">← Back to Gather</Link>
          <p className="auth-eyebrow">YOUR PEOPLE</p>
          <h1>Find your friends.</h1>
          <p>Connect your Supabase project and apply the database migrations to start finding people.</p>
          <Link className="button button-dark profile-back-button" href="/auth/login">Sign in</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="friends-page">
      <Suspense fallback={<section className="friends-card friends-card-loading" />}>
        <FriendsDashboard searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function FriendsDashboard({ searchParams }: { searchParams: FriendsSearchParams }) {
  const params = await searchParams;
  const search = cleanSearch(getParam(params.search));
  const notice = noticeText[getParam(params.notice)];
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims.sub) {
    redirect("/auth/login");
  }

  const userId = claimsData.claims.sub;
  const { data: requests, error: requestsError } = await supabase
    .from("friend_requests")
    .select("id,sender_id,receiver_id,status,created_at")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(150);

  if (requestsError) {
    throw new Error("Could not load your friend requests.");
  }

  const friendRequests = (requests ?? []) as FriendRequest[];
  const friends = friendRequests.filter((request) => request.status === "accepted");
  const incoming = friendRequests.filter(
    (request) => request.status === "pending" && request.receiver_id === userId,
  );
  const outgoing = friendRequests.filter(
    (request) => request.status === "pending" && request.sender_id === userId,
  );
  const relatedUserIds = new Set(
    friendRequests.map((request) =>
      request.sender_id === userId ? request.receiver_id : request.sender_id,
    ),
  );
  let relatedProfiles: Profile[] = [];

  if (relatedUserIds.size > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id,username,display_name,bio")
      .in("user_id", [...relatedUserIds]);

    if (error) {
      throw new Error("Could not load your friends.");
    }

    relatedProfiles = (data ?? []) as Profile[];
  }

  const profilesById = new Map(relatedProfiles.map((profile) => [profile.user_id, profile]));
  let searchResults: Profile[] = [];

  if (search.length >= 2) {
    const pattern = `%${search}%`;
    const [usernameMatches, nameMatches] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id,username,display_name,bio")
        .neq("user_id", userId)
        .ilike("username", pattern)
        .limit(10),
      supabase
        .from("profiles")
        .select("user_id,username,display_name,bio")
        .neq("user_id", userId)
        .ilike("display_name", pattern)
        .limit(10),
    ]);

    if (usernameMatches.error || nameMatches.error) {
      throw new Error("Could not search for people. Please try again.");
    }

    const uniqueProfiles = new Map<string, Profile>();
    for (const profile of [...(usernameMatches.data ?? []), ...(nameMatches.data ?? [])] as Profile[]) {
      uniqueProfiles.set(profile.user_id, profile);
    }
    searchResults = [...uniqueProfiles.values()].slice(0, 12);
  }

  const relationshipByUser = new Map<string, FriendRequest>();
  for (const request of friendRequests) {
    const otherUserId = request.sender_id === userId ? request.receiver_id : request.sender_id;
    relationshipByUser.set(otherUserId, request);
  }

  return (
    <div className="friends-shell">
      <header className="friends-header">
        <Link className="back-link" href="/">← Back to Gather</Link>
        <p className="auth-eyebrow">GOOD THINGS GROW TOGETHER</p>
        <h1>Find your people.</h1>
        <p>Make a new connection, or catch up with the friends you’ve already found.</p>
      </header>

      {notice && <p className="form-notice friends-notice" role="status">{notice}</p>}

      <section className="friends-card" aria-labelledby="find-people">
        <div className="friends-section-heading">
          <div>
            <h2 id="find-people">Find people</h2>
            <p>Search by name or username.</p>
          </div>
        </div>
        <form action="/friends" className="friend-search-form">
          <label className="visually-hidden" htmlFor="friend-search">Name or username</label>
          <input
            autoComplete="off"
            defaultValue={search}
            id="friend-search"
            maxLength={40}
            name="search"
            placeholder="Try “maya” or “mayachen”"
            type="search"
          />
          <button className="button button-dark" type="submit">Search</button>
        </form>

        {search.length > 0 && search.length < 2 && (
          <p className="friends-empty">Enter at least 2 characters to search.</p>
        )}
        {search.length >= 2 && searchResults.length === 0 && (
          <p className="friends-empty">No people found for “{search}”. Try another name.</p>
        )}
        {searchResults.length > 0 && (
          <div className="friend-list">
            {searchResults.map((profile) => {
              const relationship = relationshipByUser.get(profile.user_id);

              return (
                <article className="friend-row" key={profile.user_id}>
                  <Avatar name={profile.display_name} />
                  <div className="friend-person">
                    <strong>{profile.display_name}</strong>
                    <span>@{profile.username}</span>
                    {profile.bio && <p>{profile.bio}</p>}
                  </div>
                  {relationship?.status === "accepted" ? (
                    <span className="relationship-pill">Friends</span>
                  ) : relationship?.status === "pending" && relationship.sender_id === userId ? (
                    <span className="relationship-pill">Request sent</span>
                  ) : relationship?.status === "pending" ? (
                    <span className="relationship-pill">Request received</span>
                  ) : (
                    <form action={sendFriendRequest}>
                      <input name="userId" type="hidden" value={profile.user_id} />
                      <button className="button button-outline" type="submit">＋ Add friend</button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="friends-columns">
        <section className="friends-card" aria-labelledby="incoming-requests">
          <div className="friends-section-heading">
            <div>
              <h2 id="incoming-requests">Friend requests</h2>
              <p>People hoping to connect with you.</p>
            </div>
            {incoming.length > 0 && <span className="friends-count">{incoming.length}</span>}
          </div>
          {incoming.length === 0 ? (
            <p className="friends-empty">No new requests right now.</p>
          ) : (
            <div className="friend-list">
              {incoming.map((request) => {
                const profile = profilesById.get(request.sender_id);
                if (!profile) return null;

                return (
                  <article className="friend-row friend-row-request" key={request.id}>
                    <Avatar name={profile.display_name} />
                    <div className="friend-person">
                      <strong>{profile.display_name}</strong>
                      <span>@{profile.username}</span>
                    </div>
                    <div className="friend-request-actions">
                      <form action={respondToFriendRequest}>
                        <input name="requestId" type="hidden" value={request.id} />
                        <input name="response" type="hidden" value="accepted" />
                        <button className="button button-dark" type="submit">Accept</button>
                      </form>
                      <form action={respondToFriendRequest}>
                        <input name="requestId" type="hidden" value={request.id} />
                        <input name="response" type="hidden" value="declined" />
                        <button className="button button-muted" type="submit">Decline</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="friends-card" aria-labelledby="your-friends">
          <div className="friends-section-heading">
            <div>
              <h2 id="your-friends">Your friends</h2>
              <p>The people you’ve connected with.</p>
            </div>
            <span className="friends-count">{friends.length}</span>
          </div>
          {friends.length === 0 ? (
            <p className="friends-empty">Your friend list is just getting started. Search for someone above.</p>
          ) : (
            <div className="friend-list">
              {friends.map((request) => {
                const friendId = request.sender_id === userId ? request.receiver_id : request.sender_id;
                const profile = profilesById.get(friendId);
                if (!profile) return null;

                return (
                  <article className="friend-row" key={request.id}>
                    <Avatar name={profile.display_name} />
                    <div className="friend-person">
                      <strong>{profile.display_name}</strong>
                      <span>@{profile.username}</span>
                    </div>
                    <form action={startConversation}>
                      <input name="friendId" type="hidden" value={friendId} />
                      <button className="button button-outline" type="submit">Message</button>
                    </form>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {outgoing.length > 0 && (
        <section className="friends-card" aria-labelledby="sent-requests">
          <div className="friends-section-heading">
            <div>
              <h2 id="sent-requests">Requests you’ve sent</h2>
              <p>You can cancel a request while it’s pending.</p>
            </div>
          </div>
          <div className="friend-list">
            {outgoing.map((request) => {
              const profile = profilesById.get(request.receiver_id);
              if (!profile) return null;

              return (
                <article className="friend-row" key={request.id}>
                  <Avatar name={profile.display_name} />
                  <div className="friend-person">
                    <strong>{profile.display_name}</strong>
                    <span>@{profile.username}</span>
                  </div>
                  <form action={cancelFriendRequest}>
                    <input name="requestId" type="hidden" value={request.id} />
                    <button className="button button-muted" type="submit">Cancel request</button>
                  </form>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
