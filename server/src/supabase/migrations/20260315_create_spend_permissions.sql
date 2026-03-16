create table if not exists public.spend_permissions (
  permission_hash text primary key,
  user_address text not null,
  smart_account_address text not null,
  token_address text not null,
  chain_id integer not null,
  allowance text not null,
  period_seconds integer not null,
  start_unix bigint not null,
  end_unix bigint,
  salt text not null,
  extra_data text not null,
  signature text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  permission_json jsonb not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spend_permissions_user_address_idx
  on public.spend_permissions (user_address);

create index if not exists spend_permissions_smart_account_address_idx
  on public.spend_permissions (smart_account_address);

create index if not exists spend_permissions_status_idx
  on public.spend_permissions (status);
