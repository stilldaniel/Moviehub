# MovieApp

Browse movies, TV shows and anime, save favorites, rate and review titles, and get a personal "For You" feed.

Live: https://moviehub-eight-eta.vercel.app

## Stack

- **Next.js 16** (App Router) + React 19, Tailwind CSS v4, framer-motion
- **Supabase** for auth (email/password and Google) and user data
- **TMDB** for all movie and TV data

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where it's used | Notes |
|---|---|---|
| `TMDB_API_KEY` | Server only | Your TMDB v3 API key. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | The **publishable** key (`sb_publishable_…`). Never use a secret or `service_role` key here: anything prefixed `NEXT_PUBLIC_` is shipped to every visitor. |

On Vercel, set the same three variables for Production and Preview.

## How TMDB requests work

The TMDB key stays on the server. Server components call TMDB directly through `fetchFromTMDB` in `lib/tmdb.ts`. Browser code calls `/api/tmdb/...` (`app/api/tmdb/[...path]/route.ts`), which adds the key, only allows read-only endpoints, and caches responses for an hour.

## Supabase setup

### Tables

| Table | Columns |
|---|---|
| `profiles` | `id` (= auth user id), `full_name`, `username`, `avatar_url`, `bio`, `created_at`, `updated_at`, `last_login`, `streak_count` |
| `favorites` | `id`, `user_id`, `media_id`, `media_type`, `title`, `poster_path`, `vote_average`, `genre_ids`, `created_at` |
| `watch_history` | `id`, `user_id`, `media_id`, `media_type`, `title`, `poster_path`, `vote_average`, `genre_ids`, `runtime`, `progress`, `watched_at` — unique on `(user_id, media_id, media_type)` |
| `ratings` | `id`, `user_id`, `media_id`, `media_type`, `title`, `poster_path`, `rating`, `review`, `created_at` — unique on `(user_id, media_id, media_type)` |

There is also a public `avatars` storage bucket for profile pictures (images up to 2 MB). Each user can only upload, replace or delete their own file, named `<user id>.<ext>`:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatar owners can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and split_part(name, '.', 1) = (select auth.uid())::text);

create policy "Avatar owners can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and split_part(name, '.', 1) = (select auth.uid())::text);

create policy "Avatar owners can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and split_part(name, '.', 1) = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and split_part(name, '.', 1) = (select auth.uid())::text);

create policy "Avatar owners can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and split_part(name, '.', 1) = (select auth.uid())::text);
```

### Row Level Security

Every table must have RLS on, with users limited to their own rows:

```sql
alter table public.favorites     enable row level security;
alter table public.watch_history enable row level security;
alter table public.ratings       enable row level security;
alter table public.profiles      enable row level security;

create policy "Own favorites" on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own watch history" on public.watch_history
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own ratings" on public.ratings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Own profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
```

### Account deletion

The "Delete Account" button in Profile → Settings calls this function:

```sql
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from public.favorites     where user_id = uid;
  delete from public.watch_history where user_id = uid;
  delete from public.ratings       where user_id = uid;
  delete from public.profiles      where id = uid;
  delete from auth.users           where id = uid;
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
```

### Google sign-in

Add your site's `/auth/callback` URL (for example `https://moviehub-eight-eta.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`) under Supabase → Authentication → URL Configuration → Redirect URLs.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
