export interface Subdomeniu {
  id: string;
  nume: string;
  score: number;
}

export interface Domeniu {
  id: string;
  nume: string;
  culoare: string;
  subdomenii: Subdomeniu[];
}
