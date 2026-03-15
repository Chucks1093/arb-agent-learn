create table if not exists public.agent_wallets (
  user_address text primary key,
  owner_address text not null unique,
  smart_account_address text not null unique,
  owner_name text,
  smart_account_name text,
  mode text not null check (mode in ('mock', 'cdp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_wallets_owner_address_idx
  on public.agent_wallets (owner_address);

create index if not exists agent_wallets_smart_account_address_idx
  on public.agent_wallets (smart_account_address);
