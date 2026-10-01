-- A signed-in user can see only their own admin row; is_admin() runs as the caller.
create policy "admins can see themselves" on public.admins
  for select to authenticated
  using (email = lower(coalesce((select auth.jwt()) ->> 'email', '')));

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "site content is public" on public.site_content
  for select to anon, authenticated using (true);
create policy "admins insert site content" on public.site_content
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins update site content" on public.site_content
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "anyone can submit a lead" on public.leads
  for insert to anon, authenticated with check (true);
create policy "admins read leads" on public.leads
  for select to authenticated using ((select public.is_admin()));
create policy "admins delete leads" on public.leads
  for delete to authenticated using ((select public.is_admin()));

create policy "members read own data" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "members insert own data" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "members update own data" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "members delete own data" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Public image bucket for admin uploads (gallery, trainers, blog covers).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do nothing;

create policy "admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and (select public.is_admin()));
create policy "admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and (select public.is_admin()));
create policy "admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and (select public.is_admin()));

-- Grant admin access (run once per admin, lower-case email):
--   insert into public.admins (email) values ('owner@example.com');
