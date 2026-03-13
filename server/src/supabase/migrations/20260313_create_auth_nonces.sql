create table if not exists public.auth_nonces (
  nonce text primary key,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index if not exists auth_nonces_created_at_idx
  on public.auth_nonces (created_at desc);
