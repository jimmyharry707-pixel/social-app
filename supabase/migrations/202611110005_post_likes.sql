create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_id on public.post_likes (user_id, post_id);

alter table public.post_likes enable row level security;

grant select, insert, delete on public.post_likes to authenticated;

create policy "Users read likes on visible posts"
  on public.post_likes for select to authenticated
  using (
    exists (
      select 1
      from public.posts as post
      where post.id = post_likes.post_id
    )
  );

create policy "Users like visible posts as themselves"
  on public.post_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.posts as post
      where post.id = post_likes.post_id
    )
  );

create policy "Users remove their own likes"
  on public.post_likes for delete to authenticated
  using (user_id = (select auth.uid()));

create function public.get_post_like_summaries(p_post_ids uuid[])
returns table (post_id uuid, like_count bigint, liked_by_me boolean)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    likes.post_id,
    count(*)::bigint,
    bool_or(likes.user_id = (select auth.uid()))
  from public.post_likes as likes
  where likes.post_id = any(coalesce(p_post_ids, '{}'::uuid[]))
  group by likes.post_id;
$$;

revoke all on function public.get_post_like_summaries(uuid[]) from public;
grant execute on function public.get_post_like_summaries(uuid[]) to authenticated;
