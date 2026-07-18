-- Run this in Supabase > SQL Editor (or via `supabase db push` if you
-- adopt the Supabase CLI later).

create table if not exists datasets (
  id uuid primary key,
  owner_id uuid references auth.users (id),
  filename text not null,
  display_name text,
  storage_path text not null,
  row_count int,
  column_count int,
  quality_score numeric,
  created_at timestamptz default now()
);

-- If you already ran this schema before display_name existed, run this
-- separately instead of the create table above (it's already been created):
-- alter table datasets add column if not exists display_name text;
-- update datasets set display_name = filename where display_name is null;

alter table datasets enable row level security;

-- Users can only see their own datasets. The backend uses the
-- service_role key, which bypasses RLS entirely, so this only affects
-- any direct-from-browser Supabase queries the frontend might make later.
create policy "Users can view own datasets"
  on datasets for select
  using (auth.uid() = owner_id);

create policy "Users can insert own datasets"
  on datasets for insert
  with check (auth.uid() = owner_id);

-- Storage bucket: create this once via Supabase Dashboard > Storage > New
-- bucket, name it "datasets", and mark it PRIVATE (not public). The
-- backend's service_role key can read/write it regardless of RLS;
-- add storage policies here only if the frontend will also read directly.
