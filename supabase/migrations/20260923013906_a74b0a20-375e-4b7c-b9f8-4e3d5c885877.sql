
create table public.fee_plans (
  plan text primary key,
  amount numeric not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.fee_plans (plan, amount) values ('1x', 55), ('2x', 95), ('particular', 140);

grant select on public.fee_plans to authenticated;
grant all on public.fee_plans to service_role;

alter table public.fee_plans enable row level security;

create policy "fee plans read"
  on public.fee_plans for select to authenticated using (true);

create policy "admin manages fee plans"
  on public.fee_plans for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

create table public.club_settings (
  id boolean primary key default true,
  bizum_phone text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.club_settings (id) values (true);

grant select on public.club_settings to authenticated;
grant all on public.club_settings to service_role;

alter table public.club_settings enable row level security;

create policy "club settings read"
  on public.club_settings for select to authenticated using (true);

create policy "admin manages club settings"
  on public.club_settings for all to authenticated
  using (private.has_role(auth.uid(), 'admin'::app_role))
  with check (private.has_role(auth.uid(), 'admin'::app_role));

alter table public.payments add column method text not null default 'manual';
