 -- Tabel angajați HR
create table if not exists hr_angajati (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references organizations(id) on delete cascade,
    nume text not null,
    prenume text not null,
    sectie text not null,
    rol text not null,
    tip_contract text default 'norma_intreaga', -- norma_intreaga, partial, garda
    ideal_legal integer default 0,
    ideal_ajustat integer default 0,
    respondent boolean default false,
    activ boolean default true,
    data_angajare date,
    cnp text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index pentru filtrare rapidă
create index if not exists hr_angajati_org_id_idx on hr_angajati(org_id);
create index if not exists hr_angajati_sectie_idx on hr_angajati(sectie);

-- RLS
alter table hr_angajati enable row level security;

create policy "Utilizatori autentificati isi vad proprii angajati"
on hr_angajati for all
using (
    org_id in (
        select id from organizations where user_id = auth.uid()
    )
);
