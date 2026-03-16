alter table public.agent_wallets
add column if not exists spend_permissions_enabled boolean not null default false;

update public.agent_wallets
set spend_permissions_enabled = true
where mode = 'mock';
