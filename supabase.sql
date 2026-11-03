create table if not exists logins (
  id bigint generated always as identity primary key,
  email text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
