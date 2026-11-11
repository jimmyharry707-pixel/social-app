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
   key from the project's API settings. Never put a `service_role` key in a
   `NEXT_PUBLIC_` variable or commit real credentials.
3. Run `supabase/migrations/202611110001_initial_schema.sql` in the Supabase SQL
   Editor (or apply it with the Supabase CLI).

The migration creates profiles, friend requests, posts, conversations, members,
and messages. Row-level security is enabled on every table; user-owned content
is scoped to its owner, posts are visible to friends, and conversations are
restricted to their members. The app currently shows a static UI preview; sign-in
and data-backed features are planned next.

## Checks

```bash
npm run lint
npm run build
```
