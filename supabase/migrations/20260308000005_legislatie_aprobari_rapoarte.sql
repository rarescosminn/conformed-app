 -- Legislatie
create table if not exists legislatie (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    titlu text not null,
    categorie text not null,
    numar text,
    emitent text,
    data_publicare date,
    data_intrare_vigoare date,
    url text,
    rezumat text,
    activ boolean default true,
    created_at timestamptz default now()
);

create index if not exists legislatie_org_id_idx on legislatie(org_id);
create index if not exists legislatie_categorie_idx on legislatie(categorie);

alter table legislatie enable row level security;

drop policy if exists "Acces legislatie per org" on legislatie;
create policy "Acces legislatie per org"
on legislatie for all
using (org_id in (select id from organizations where user_id = auth.uid()));

-- Aprobari
create table if not exists aprobari (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    titlu text not null,
    tip text not null, -- document, report, revision, request
    categorie text not null,
    status text default 'pending', -- pending, approved, rejected, changes
    submitted_by text,
    assignee text,
    submitted_at timestamptz default now(),
    due_at timestamptz,
    note text,
    history jsonb default '[]',
    archive_at timestamptz,
    created_at timestamptz default now()
);

create index if not exists aprobari_org_id_idx on aprobari(org_id);
create index if not exists aprobari_status_idx on aprobari(status);

alter table aprobari enable row level security;

drop policy if exists "Acces aprobari per org" on aprobari;
create policy "Acces aprobari per org"
on aprobari for all
using (org_id in (select id from organizations where user_id = auth.uid()));

-- Rapoarte
create table if not exists rapoarte (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    titlu text not null,
    descriere text,
    autor text,
    rol text,
    size_mb numeric(6,2),
    tip text default 'PDF',
    tags jsonb default '[]',
    an integer,
    luna integer,
    url text,
    created_at timestamptz default now()
);

create index if not exists rapoarte_org_id_idx on rapoarte(org_id);
create index if not exists rapoarte_an_luna_idx on rapoarte(an, luna);

alter table rapoarte enable row level security;

drop policy if exists "Acces rapoarte per org" on rapoarte;
create policy "Acces rapoarte per org"
on rapoarte for all
using (org_id in (select id from organizations where user_id = auth.uid()));
