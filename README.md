# Gather

Gather is a social app starter for sharing posts and keeping up with friends. It
uses Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase foundation

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable
   key from the project's API settings. Set `NEXT_PUBLIC_SITE_URL` to your app's
   origin and add `<site-url>/auth/callback` to the Supabase Auth redirect URL
   allow list. Never put a `service_role` key in a `NEXT_PUBLIC_` variable or
   commit real credentials. Set these values before starting the dev server or
   building for production.
3. Run the migrations in order in the Supabase SQL Editor (or apply them with
   the Supabase CLI):
   - `supabase/migrations/202611110001_initial_schema.sql`
   - `supabase/migrations/202611110002_auth_profiles.sql`
   - `supabase/migrations/202611110003_blog_post_titles.sql`
   - `supabase/migrations/202611110004_direct_chat.sql`

The migration creates profiles, friend requests, posts, conversations, members,
and messages. Row-level security is enabled on every table; user-owned content
is scoped to its owner, posts are visible to friends, and conversations are
restricted to their members. The app currently shows a UI preview.
Email/password sign-up, sign-in, session refresh, sign-out, and profile editing
are wired to Supabase. Sign-up creates a profile through a database trigger;
email confirmation behavior depends on your Supabase Auth settings. The friends
page supports profile search, incoming and outgoing requests, accepting,
declining, cancellation, and a friend list. The feed reads posts visible under
the database's friend policies. Signed-in users can create, edit, and delete
their own titled posts; post detail pages show full content. Without Supabase
credentials, the feed displays clearly marked sample stories. Friends can start
one-to-one conversations, browse their inbox, and send messages with realtime
updates. The chat migration enables message replication for Supabase Realtime
and only allows participants to read their conversation.

## Checks

```bash
npm run lint
npm run build
```

## Before production

- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
  `NEXT_PUBLIC_SITE_URL` in the hosting provider; never configure a service-role
  key in the browser.
- Apply all four SQL migrations in order and verify the `messages` table is
  enabled for Supabase Realtime.
- Add the production `<site-url>/auth/callback` to Supabase Auth's allowed
  redirect URLs and verify email confirmation settings.
- Test sign-up/confirmation, sign-in/sign-out, profile edits, friend request
  transitions, post ownership, direct-message membership, and realtime updates
  with separate test accounts.
- Run the checks above against the production environment, then smoke-test the
  home, friends, post, and messaging routes after deployment.
