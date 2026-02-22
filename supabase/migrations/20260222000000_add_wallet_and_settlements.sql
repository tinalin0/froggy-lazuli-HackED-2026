-- Add wallet_address to members (for on-chain settlement participants)
alter table members add column if not exists wallet_address text;

-- On-chain settlement records
create table if not exists group_settlements (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references groups(id) on delete cascade,
  settlement_id     text not null,
  tx_hash           text,
  settlement_hash   text not null,
  committed_by      text not null,
  created_at        timestamptz not null default now()
);
create index if not exists group_settlements_group_id_idx on group_settlements(group_id);
alter table group_settlements enable row level security;
create policy "allow all group_settlements" on group_settlements for all using (true) with check (true);
