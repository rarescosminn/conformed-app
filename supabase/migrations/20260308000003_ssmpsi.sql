 -- Instruiri SSM
create table if not exists ssm_instruiri (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    angajat_id uuid references hr_angajati(id) on delete set null,
    tip text not null, -- introductiv_general, la_locul_de_munca, periodic
    data_instruire date not null default now(),
    data_expirare date,
    instructor text,
    finalizat boolean default false,
    created_at timestamptz default now()
);

create index if not exists ssm_instruiri_org_id_idx on ssm_instruiri(org_id);

alter table ssm_instruiri enable row level security;

drop policy if exists "Acces ssm_instruiri per org" on ssm_instruiri;
create policy "Acces ssm_instruiri per org"
on ssm_instruiri for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Incidente SSM
create table if not exists ssm_incidente (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    data_incident date not null default now(),
    tip text not null, -- accident, incident, near_miss
    descriere text,
    angajat_id uuid references hr_angajati(id) on delete set null,
    clasificare text,
    status text default 'deschis',
    created_at timestamptz default now()
);

create index if not exists ssm_incidente_org_id_idx on ssm_incidente(org_id);

alter table ssm_incidente enable row level security;

drop policy if exists "Acces ssm_incidente per org" on ssm_incidente;
create policy "Acces ssm_incidente per org"
on ssm_incidente for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Echipamente PSI
create table if not exists psi_echipamente (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    tip text not null, -- stingator, hidrant, trusa, alarma
    numar_inventar text,
    locatie text,
    data_verificare date,
    data_expirare date,
    status text default 'ok',
    created_at timestamptz default now()
);

create index if not exists psi_echipamente_org_id_idx on psi_echipamente(org_id);

alter table psi_echipamente enable row level security;

drop policy if exists "Acces psi_echipamente per org" on psi_echipamente;
create policy "Acces psi_echipamente per org"
on psi_echipamente for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- EIP
create table if not exists ssm_eip (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    angajat_id uuid references hr_angajati(id) on delete set null,
    tip text not null,
    marime text,
    data_distribuire date,
    data_expirare date,
    confirmat boolean default false,
    created_at timestamptz default now()
);

create index if not exists ssm_eip_org_id_idx on ssm_eip(org_id);

alter table ssm_eip enable row level security;

drop policy if exists "Acces ssm_eip per org" on ssm_eip;
create policy "Acces ssm_eip per org"
on ssm_eip for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Evacuări PSI
create table if not exists psi_evacuari (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    data_planificata date not null,
    data_efectuata date,
    recurenta text default 'anual',
    status text default 'planificat',
    observatii text,
    created_at timestamptz default now()
);

create index if not exists psi_evacuari_org_id_idx on psi_evacuari(org_id);

alter table psi_evacuari enable row level security;

drop policy if exists "Acces psi_evacuari per org" on psi_evacuari;
create policy "Acces psi_evacuari per org"
on psi_evacuari for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Riscuri SSM
create table if not exists ssm_riscuri (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    descriere text not null,
    responsabil text,
    termen date,
    status text default 'deschis',
    created_at timestamptz default now()
);

create index if not exists ssm_riscuri_org_id_idx on ssm_riscuri(org_id);

alter table ssm_riscuri enable row level security;

drop policy if exists "Acces ssm_riscuri per org" on ssm_riscuri;
create policy "Acces ssm_riscuri per org"
on ssm_riscuri for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);
