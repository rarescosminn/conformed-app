 -- Cerinte conformare
create table if not exists conformare_cerinte (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    domeniu text not null, -- ISO9001, ISO14001, SSM, PSI etc.
    cerinta text not null,
    status text default 'neconform', -- conform, partial, neconform
    scor integer default 0,
    responsabil text,
    termen date,
    observatii text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists conformare_cerinte_org_id_idx on conformare_cerinte(org_id);
create index if not exists conformare_cerinte_domeniu_idx on conformare_cerinte(domeniu);

alter table conformare_cerinte enable row level security;

drop policy if exists "Acces conformare_cerinte per org" on conformare_cerinte;
create policy "Acces conformare_cerinte per org"
on conformare_cerinte for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Chestionare generic
create table if not exists chestionare_generic (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    categorie text not null,
    titlu text not null,
    intrebari jsonb not null default '[]',
    activ boolean default true,
    created_at timestamptz default now()
);

create index if not exists chestionare_generic_org_id_idx on chestionare_generic(org_id);

alter table chestionare_generic enable row level security;

drop policy if exists "Acces chestionare_generic per org" on chestionare_generic;
create policy "Acces chestionare_generic per org"
on chestionare_generic for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Raspunsuri chestionare
create table if not exists chestionare_raspunsuri (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    chestionar_id uuid not null references chestionare_generic(id) on delete cascade,
    respondent_id uuid references hr_angajati(id) on delete set null,
    raspunsuri jsonb not null default '{}',
    scor integer,
    completat_la timestamptz default now()
);

create index if not exists chestionare_raspunsuri_org_id_idx on chestionare_raspunsuri(org_id);
create index if not exists chestionare_raspunsuri_chestionar_id_idx on chestionare_raspunsuri(chestionar_id);

alter table chestionare_raspunsuri enable row level security;

drop policy if exists "Acces chestionare_raspunsuri per org" on chestionare_raspunsuri;
create policy "Acces chestionare_raspunsuri per org"
on chestionare_raspunsuri for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);

-- Documente
create table if not exists documente (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    titlu text not null,
    categorie text not null,
    subcategorie text,
    versiune text default '1.0',
    url text,
    status text default 'draft', -- draft, activ, arhivat
    autor text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists documente_org_id_idx on documente(org_id);
create index if not exists documente_categorie_idx on documente(categorie);

alter table documente enable row level security;

drop policy if exists "Acces documente per org" on documente;
create policy "Acces documente per org"
on documente for all
using (
    org_id in (select id from organizations where user_id = auth.uid())
);
