alter table public.posts
  add column title text
    check (title is null or char_length(btrim(title)) between 1 and 120);

create index posts_created_at on public.posts (created_at desc);
