export type Area = 'administratie';

export type Subdomain =
    | 'mentenanta'
    | 'retelistica'
    | 'necalificati'
    | 'centralist'
    | 'heliport'
    | 'proiecte-urgente';

export type Scope = {
    area: Area;            // ex. 'administratie'
    subdomain: Subdomain;  // ex. 'retelistica'
};
