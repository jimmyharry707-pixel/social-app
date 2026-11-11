create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username = lower(username) and username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 280),
  avatar_url text,
  created_at timestamptz not null default now()
);

create function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.user_id is distinct from old.user_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Profile owner and creation time cannot change';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  receiver_id uuid not null references public.profiles (user_id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  constraint friend_requests_not_self check (sender_id <> receiver_id)
);

create unique index friend_requests_one_pending_per_pair
  on public.friend_requests (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  where status = 'pending';

create function public.are_friends(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.friend_requests as request
    where request.status = 'accepted'
      and (
        (request.sender_id = (select auth.uid()) and request.receiver_id = p_user_id)
        or (request.receiver_id = (select auth.uid()) and request.sender_id = p_user_id)
      )
  );
$$;

revoke all on function public.are_friends(uuid) from public;
grant execute on function public.are_friends(uuid) to authenticated;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_author_created_at on public.posts (author_id, created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_at
  on public.messages (conversation_id, created_at desc);

create function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members as member
    where member.conversation_id = p_conversation_id
      and member.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create function public.guard_friend_request_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sender_id is distinct from old.sender_id
    or new.receiver_id is distinct from old.receiver_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Friend request participants and creation time cannot change';
  end if;

  if old.status <> 'pending'
    or new.status not in ('accepted', 'declined')
    or (select auth.uid()) is distinct from old.receiver_id then
    raise exception 'Only the recipient can accept or decline a pending request';
  end if;

  return new;
end;
$$;

create trigger friend_requests_guard_update
  before update on public.friend_requests
  for each row execute function public.guard_friend_request_update();

create function public.guard_post_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Post author and creation time cannot change';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_guard_update
  before update on public.posts
  for each row execute function public.guard_post_update();

create function public.guard_message_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.sender_id is distinct from old.sender_id
    or new.conversation_id is distinct from old.conversation_id
    or new.created_at is distinct from old.created_at then
    raise exception 'Message sender, conversation, and creation time cannot change';
  end if;

  return new;
end;
$$;

create trigger messages_guard_update
  before update on public.messages
  for each row execute function public.guard_message_update();

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.posts enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.friend_requests to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.conversation_members to authenticated;
grant select, insert on public.messages to authenticated;

create policy "Profiles are visible to signed-in users"
  on public.profiles for select to authenticated
  using (true);

create policy "Users create their own profile"
  on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users read their own friend requests"
  on public.friend_requests for select to authenticated
  using (
    sender_id = (select auth.uid())
    or receiver_id = (select auth.uid())
  );

create policy "Users send friend requests"
  on public.friend_requests for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and status = 'pending'
    and not public.are_friends(receiver_id)
  );

create policy "Recipients respond to pending friend requests"
  on public.friend_requests for update to authenticated
  using (
    receiver_id = (select auth.uid())
    and status = 'pending'
  )
  with check (
    receiver_id = (select auth.uid())
    and status in ('accepted', 'declined')
  );

create policy "Senders cancel pending friend requests"
  on public.friend_requests for delete to authenticated
  using (
    sender_id = (select auth.uid())
    and status = 'pending'
  );

create policy "Users read their own and friends' posts"
  on public.posts for select to authenticated
  using (
    author_id = (select auth.uid())
    or public.are_friends(author_id)
  );

create policy "Users create their own posts"
  on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()));

create policy "Users update their own posts"
  on public.posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Users delete their own posts"
  on public.posts for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "Users create conversations as themselves"
  on public.conversations for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "Members read their conversations"
  on public.conversations for select to authenticated
  using (
    created_by = (select auth.uid())
    or public.is_conversation_member(id)
  );

create policy "Members read conversation membership"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "Conversation creators add themselves or friends"
  on public.conversation_members for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations as conversation
      where conversation.id = conversation_id
        and conversation.created_by = (select auth.uid())
    )
    and (
      user_id = (select auth.uid())
      or public.are_friends(user_id)
    )
  );

create policy "Members read messages in their conversations"
  on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "Members send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_conversation_member(conversation_id)
  );
