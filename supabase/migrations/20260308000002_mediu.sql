 -- Deșeuri
create table if not exists mediu_deseuri (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    data date not null,
    culoare text not null,
    marime text not null,
    nr_bucati integer not null default 1,
    grad_umplere integer not null default 100,
    kg_estimat numeric(8,2),
    validat boolean default false,
    validat_de text,
    created_at timestamptz default now()
);

create index if not exists mediu_deseuri_org_id_idx on mediu_deseuri(org_id);
create index if not exists mediu_deseuri_data_idx on mediu_deseuri(data);

alter table mediu_deseuri enable row level security;

create policy "Acces mediu_deseuri per org"
on mediu_deseuri for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Contracte / Autorizații
create table if not exists mediu_contracte (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    tip text not null, -- autorizatie, contract
    numar text,
    emitent text,
    valabil_pana date,
    scan_url text,
    created_at timestamptz default now()
);

create index if not exists mediu_contracte_org_id_idx on mediu_contracte(org_id);

alter table mediu_contracte enable row level security;

create policy "Acces mediu_contracte per org"
on mediu_contracte for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);
