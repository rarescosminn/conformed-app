
create table if not exists sections(id text primary key, name text);
create table if not exists questionnaires(id text primary key, title text);
create table if not exists questions(id text primary key, questionnaireId text references questionnaires(id), "order" int, text text, type text, options text[] default '{}', legalRefCodes text[] default '{}');
create table if not exists responses(id uuid primary key default gen_random_uuid(), questionId text references questions(id), userId text, sectionId text references sections(id), answer text, observations text default '', evidenceFileIds text[] default '{}', status text default 'draft', createdAt timestamptz default now());
create table if not exists legal_docs(code text primary key, title text, url text);
