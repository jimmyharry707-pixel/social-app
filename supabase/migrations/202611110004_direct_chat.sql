create index conversation_members_user_id
  on public.conversation_members (user_id, conversation_id);

create function public.create_direct_conversation(p_friend_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_conversation_id uuid;
begin
  if v_user_id is null or p_friend_id is null or p_friend_id = v_user_id then
    raise exception 'A valid friend is required';
  end if;

  if not exists (
    select 1
    from public.friend_requests as request
    where request.status = 'accepted'
      and (
        (request.sender_id = v_user_id and request.receiver_id = p_friend_id)
        or (request.receiver_id = v_user_id and request.sender_id = p_friend_id)
      )
  ) then
    raise exception 'You can only start a conversation with a friend';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      least(v_user_id::text, p_friend_id::text)
        || ':'
        || greatest(v_user_id::text, p_friend_id::text),
      0
    )
  );

  select conversation.id
  into v_conversation_id
  from public.conversations as conversation
  where exists (
    select 1
    from public.conversation_members as first_member
    where first_member.conversation_id = conversation.id
      and first_member.user_id = v_user_id
  )
    and exists (
      select 1
      from public.conversation_members as second_member
      where second_member.conversation_id = conversation.id
        and second_member.user_id = p_friend_id
    )
    and (
      select count(*)
      from public.conversation_members as member
      where member.conversation_id = conversation.id
    ) = 2
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.conversations (created_by)
  values (v_user_id)
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values
    (v_conversation_id, v_user_id),
    (v_conversation_id, p_friend_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create function public.get_my_conversations()
returns table (
  conversation_id uuid,
  friend_id uuid,
  friend_username text,
  friend_display_name text,
  last_message text,
  last_message_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    mine.conversation_id,
    friend.user_id,
    friend.username,
    friend.display_name,
    latest.body,
    latest.created_at
  from public.conversation_members as mine
  join public.conversation_members as other_member
    on other_member.conversation_id = mine.conversation_id
    and other_member.user_id <> mine.user_id
  join public.profiles as friend
    on friend.user_id = other_member.user_id
  left join lateral (
    select message.body, message.created_at
    from public.messages as message
    where message.conversation_id = mine.conversation_id
    order by message.created_at desc
    limit 1
  ) as latest on true
  where mine.user_id = (select auth.uid())
    and (
      select count(*)
      from public.conversation_members as member
      where member.conversation_id = mine.conversation_id
    ) = 2
  order by coalesce(latest.created_at, mine.joined_at) desc
  limit 100;
$$;

revoke all on function public.get_my_conversations() from public;
grant execute on function public.get_my_conversations() to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
