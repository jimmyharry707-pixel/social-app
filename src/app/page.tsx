import Link from "next/link";
import { Suspense } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";

import { AccountMenu } from "./account-menu";
import { FeedPostList } from "./blog/feed";

const people = [
  { name: "Nina Patel", detail: "Loves books & long walks", initials: "NP", color: "yellow" },
  { name: "Theo Martin", detail: "Photographer, coffee person", initials: "TM", color: "green" },
  { name: "Amara Okafor", detail: "Making things on the internet", initials: "AO", color: "lavender" },
];

function Avatar({
  initials,
  color,
  size = "regular",
}: {
  initials: string;
  color: string;
  size?: "regular" | "small";
}) {
  return (
    <span className={`avatar avatar-${color} avatar-${size}`} aria-hidden="true">
      {initials}
    </span>
  );
}

function Wordmark() {
  return (
    <a className="wordmark" href="#home" aria-label="Gather home">
      <span className="wordmark-icon" aria-hidden="true">
        g
      </span>
      gather
    </a>
  );
}

export default function Home() {
  const createPostHref = getSupabaseEnv() ? "/blog/new" : "/auth/login";

  return (
    <div className="app-shell" id="home">
      <header className="topbar">
        <Wordmark />
        <label className="search-box">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <span className="visually-hidden">Search Gather</span>
          <input type="search" placeholder="Search people and posts" />
          <kbd>⌘ K</kbd>
        </label>
        <div className="topbar-actions">
          <a className="icon-button notification-button" href="#notifications" aria-label="Notifications">
            ♧<span className="notification-dot" />
          </a>
          <AccountMenu />
        </div>
      </header>

      <div className="page-layout">
        <aside className="left-sidebar" aria-label="Main navigation">
          <p className="sidebar-label">YOUR SPACE</p>
          <nav className="primary-nav">
            <a className="nav-link active" href="#feed" aria-current="page">
              <span className="nav-icon" aria-hidden="true">⌂</span> Home
            </a>
            <a className="nav-link" href="#stories">
              <span className="nav-icon" aria-hidden="true">▤</span> Stories
            </a>
            <Link className="nav-link" href="/friends">
              <span className="nav-icon" aria-hidden="true">♧</span> Friends
            </Link>
            <Link className="nav-link" href="/messages">
              <span className="nav-icon" aria-hidden="true">▱</span> Messages
            </Link>
          </nav>
          <div className="sidebar-divider" />
          <p className="sidebar-label">YOUR CIRCLES</p>
          <a className="circle-link" href="#circles">
            <span className="circle-dot circle-dot-peach" /> Weekend wanderers
          </a>
          <a className="circle-link" href="#circles">
            <span className="circle-dot circle-dot-blue" /> Little book club
          </a>
          <a className="circle-link" href="#circles">
            <span className="circle-dot circle-dot-green" /> Makers & doers
          </a>
          <a className="create-circle" href="#circles">＋ Create a circle</a>
          <div className="sidebar-note">
            <span className="note-sparkle" aria-hidden="true">✳</span>
            <p>A little corner of the internet that feels like yours.</p>
          </div>
          <a className="sidebar-footer" href="#about">About Gather <span>·</span> Help</a>
        </aside>

        <main className="feed-column" id="feed">
          <section className="welcome-block">
            <div>
              <p className="eyebrow">WEDNESDAY, NOVEMBER 11</p>
              <h1>A good day to <span>gather.</span></h1>
              <p className="welcome-copy">Here’s what your people have been up to.</p>
            </div>
            <span className="welcome-doodle" aria-hidden="true">✳</span>
          </section>

          <section className="stories-section" id="stories" aria-labelledby="stories-title">
            <div className="section-heading">
              <h2 id="stories-title">Little moments</h2>
              <a href="#stories">See all <span aria-hidden="true">→</span></a>
            </div>
            <div className="story-row">
              <a className="story-card story-add" href="#new-story">
                <span className="story-add-avatar"><Avatar initials="SK" color="lavender" /></span>
                <span className="story-add-mark">＋</span>
                <span className="story-name">Your moment</span>
              </a>
              <a className="story-card story-maya" href="#maya-story">
                <Avatar initials="MC" color="coral" />
                <span className="story-name">Maya</span>
              </a>
              <a className="story-card story-jordan" href="#jordan-story">
                <Avatar initials="JL" color="blue" />
                <span className="story-name">Jordan</span>
              </a>
              <a className="story-card story-nina" href="#nina-story">
                <Avatar initials="NP" color="yellow" />
                <span className="story-name">Nina</span>
              </a>
              <a className="story-card story-theo" href="#theo-story">
                <Avatar initials="TM" color="green" />
                <span className="story-name">Theo</span>
              </a>
            </div>
          </section>

          <section className="composer-card" id="new-post" aria-label="Create a post">
            <div className="composer-top">
              <Avatar initials="SK" color="lavender" />
              <Link href={createPostHref} className="composer-prompt">What story would you like to share?</Link>
            </div>
            <div className="composer-bottom">
              <span className="composer-hint">A thought, a story, anything.</span>
              <Link className="button button-dark" href={createPostHref}>Write a post <span aria-hidden="true">↗</span></Link>
            </div>
          </section>

          <div className="feed-heading">
            <h2>Your people’s stories</h2>
            <Link className="feed-filter" href={createPostHref}>Write a post <span aria-hidden="true">↗</span></Link>
          </div>

          <Suspense fallback={<div className="post-list"><article className="post-card post-loading" /></div>}>
            <FeedPostList />
          </Suspense>
        </main>

        <aside className="right-sidebar">
          <section className="people-card" id="people" aria-labelledby="people-title">
            <div className="section-heading">
              <h2 id="people-title">People to know</h2>
              <Link href="/friends">See all</Link>
            </div>
            <div className="people-list">
              {people.map((person) => (
                <div className="person-row" key={person.initials}>
                  <Avatar initials={person.initials} color={person.color} />
                  <div className="person-info">
                    <a href={`#${person.initials}`} className="author-name">{person.name}</a>
                    <span>{person.detail}</span>
                  </div>
                  <Link className="add-friend-button" href="/friends" aria-label={`Find ${person.name} and send a friend request`}>＋</Link>
                </div>
              ))}
            </div>
            <Link className="text-link" href="/friends">Find your people <span aria-hidden="true">→</span></Link>
          </section>

          <section className="messages-card" id="messages" aria-labelledby="messages-title">
            <div className="section-heading">
              <h2 id="messages-title">Your conversations</h2>
              <Link href="/messages" aria-label="All conversations">↗</Link>
            </div>
            <Link href="/messages" className="conversation-row">
              <span className="online-avatar"><Avatar initials="MC" color="coral" /><span /></span>
              <span className="conversation-info"><strong>Maya Chen</strong><span>That garden idea sounds lovely!</span></span>
              <span className="conversation-time">2m</span>
            </Link>
            <Link href="/messages" className="conversation-row">
              <Avatar initials="TM" color="green" />
              <span className="conversation-info"><strong>Theo Martin</strong><span>Sent you a photo</span></span>
              <span className="conversation-time">1h</span>
            </Link>
            <Link href="/messages" className="text-link">Open your inbox <span aria-hidden="true">→</span></Link>
          </section>

          <div className="quote-card">
            <span className="quote-mark" aria-hidden="true">“</span>
            <p>Friendship is born at that moment when one person says to another: What! You too?</p>
            <span className="quote-credit">C. S. Lewis</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
