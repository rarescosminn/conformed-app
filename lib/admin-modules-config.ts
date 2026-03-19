// lib/admin-modules-config.ts
// ================================================================
// CONFIGURARE COMPLETĂ module Administrație per categorie activitate
// Sursa unică de adevăr pentru cardurile din /administratie
// ================================================================

export type CategorieActivitate =
  | 'horeca'
  | 'constructii'
  | 'productie'
  | 'comert'
  | 'it'
  | 'transport'
  | 'servicii_profesionale'
  | 'educatie'
  | 'financiar'
  | 'agricultura'
  | 'sanatate'
  | 'altele';

export type AdminCard = {
  href: string;
  title: string;
  desc: string;
  iconKey: string;
};

// ----------------------------------------------------------------
// CATEGORII — label + descriere pentru onboarding
// ----------------------------------------------------------------
export const CATEGORII_ACTIVITATE: Record<CategorieActivitate, { label: string; description: string }> = {
  horeca:                { label: 'HoReCa / Alimentar',       description: 'Restaurante, hoteluri, catering, alimentație publică.' },
  constructii:           { label: 'Construcții',               description: 'Construcții civile, industriale, infrastructură.' },
  productie:             { label: 'Producție / Industrie',     description: 'Fabrici, uzine, producție industrială.' },
  comert:                { label: 'Comerț / Retail',           description: 'Magazine, supermarketuri, comerț online.' },
  it:                    { label: 'IT / Tehnologie',           description: 'Companii software, IT, telecomunicații.' },
  transport:             { label: 'Transport / Logistică',     description: 'Transport rutier, depozitare, curierat.' },
  servicii_profesionale: { label: 'Servicii profesionale',     description: 'Consultanță, juridic, contabilitate, audit.' },
  educatie:              { label: 'Educație',                  description: 'Școli, universități, centre de formare.' },
  financiar:             { label: 'Financiar / Bancar',        description: 'Bănci, IFN-uri, asigurări, servicii financiare.' },
  agricultura:           { label: 'Agricultură',               description: 'Ferme, culturi agricole, zootehnie.' },
  sanatate:              { label: 'Sănătate / Medical',        description: 'Clinici, cabinete, centre medicale.' },
  altele:                { label: 'Altele',                    description: 'Orice alt domeniu de activitate.' },
};

// ----------------------------------------------------------------
// CARDURI PER CATEGORIE
// ----------------------------------------------------------------

const CARDS_HORECA: AdminCard[] = [
  { href: '/administratie/bucatarie',         title: 'Bucătărie / HACCP',           desc: 'Alergeni, temperaturi, igienizare — gestiune globală.',         iconKey: 'kitchen'    },
  { href: '/administratie/retetar',           title: 'Rețetar & Meniu',             desc: 'Gestiune rețete, meniuri, gramaje, costuri.',                   iconKey: 'menu'       },
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare & Stocuri',     desc: 'Furnizori, recepție marfă, inventar.',                          iconKey: 'stock'      },
  { href: '/administratie/siguranta-alim',    title: 'Siguranța alimentară',        desc: 'Trasabilitate, documente ANSVSA, autorizații sanitare.',         iconKey: 'safety'     },
  { href: '/administratie/personal',          title: 'Personal & Ture',             desc: 'Pontaj, ture, prezență.',                                       iconKey: 'users'      },
  { href: '/administratie/mentenanta',        title: 'Mentenanță echipamente',      desc: 'Revizie, reparații, frigotehnie.',                              iconKey: 'maintenance'},
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'LAN/Wi-Fi/VPN/Firewall — continuitate și securitate.',           iconKey: 'network'    },
  { href: '/administratie/curatenie',         title: 'Curățenie',                   desc: 'Spații, protocoale, consumabile.',                              iconKey: 'cleaning'   },
  { href: '/administratie/deseuri-alim',      title: 'Deșeuri alimentare',          desc: 'Gestiune, cântărire, raportare.',                               iconKey: 'waste'      },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Renovări, reparații majore, proiecte în curs.',                 iconKey: 'projects'   },
];

const CARDS_CONSTRUCTII: AdminCard[] = [
  { href: '/administratie/santiere',          title: 'Șantiere active',             desc: 'Urmărire lucrări, faze determinante.',                          iconKey: 'construction'},
  { href: '/administratie/permise',           title: 'Permise & Autorizații',       desc: 'AC, ISC, mediu — scadențe și documente.',                       iconKey: 'permit'     },
  { href: '/administratie/utilaje',           title: 'Utilaje & Echipamente',       desc: 'Parc auto, evidență, inspecții, ITP.',                          iconKey: 'equipment'  },
  { href: '/administratie/subcontractori',    title: 'Subcontractori',              desc: 'Contracte, autorizații, evaluare.',                             iconKey: 'partners'   },
  { href: '/administratie/calitate-lucrari',  title: 'Calitate lucrări',            desc: 'Procese verbale, faze determinante, cărți tehnice.',            iconKey: 'quality'    },
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare & Materiale',   desc: 'Comenzi, recepție, stocuri materiale.',                         iconKey: 'stock'      },
  { href: '/administratie/necalificati',      title: 'Muncitori necalificați',      desc: 'Pontaj zilieri, echipamente protecție.',                        iconKey: 'cleaning'   },
  { href: '/administratie/deseuri',           title: 'Deșeuri construcții',         desc: 'Gestiune, transport, eliminare conform lege.',                  iconKey: 'waste'      },
  { href: '/administratie/receptii',          title: 'Recepții lucrări',            desc: 'Recepție la terminare, finală, garanții.',                      iconKey: 'checklist'  },
  { href: '/administratie/documentatie',      title: 'Documentație tehnică',        desc: 'Planuri, proiecte, avize, modificări.',                         iconKey: 'docs'       },
  { href: '/administratie/mentenanta',        title: 'Mentenanță',                  desc: 'Întreținere echipamente, clădiri.',                             iconKey: 'maintenance'},
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'IT șantier/birou — continuitate și securitate.',                iconKey: 'network'    },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

const CARDS_PRODUCTIE: AdminCard[] = [
  { href: '/administratie/linii-productie',   title: 'Linii de producție',          desc: 'Capacitate, opriri, randament.',                                iconKey: 'production' },
  { href: '/administratie/plan-productie',    title: 'Plan producție',              desc: 'Programare, capacitate, termene livrare.',                      iconKey: 'planning'   },
  { href: '/administratie/calitate',          title: 'Calitate producție',          desc: 'Nonconformități, rebuturi, inspecții.',                         iconKey: 'quality'    },
  { href: '/administratie/utilaje',           title: 'Utilaje & Echipamente',       desc: 'Evidență parc, inspecții ISCIR, verificări periodice.',         iconKey: 'equipment'  },
  { href: '/administratie/mentenanta',        title: 'Mentenanță',                  desc: 'Preventivă, corectivă, planificată.',                           iconKey: 'maintenance'},
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare & Stocuri',     desc: 'Materii prime, semifabricate, inventar.',                       iconKey: 'stock'      },
  { href: '/administratie/depozit',           title: 'Depozit & Logistică',         desc: 'Gestiune, expedieri, recepții.',                                iconKey: 'warehouse'  },
  { href: '/administratie/deseuri',           title: 'Deșeuri industriale',         desc: 'Gestiune, raportare, eliminare.',                               iconKey: 'waste'      },
  { href: '/administratie/energie',           title: 'Energie & Utilități',         desc: 'Consum gaz, curent, apă, raportare.',                           iconKey: 'energy'     },
  { href: '/administratie/mediu',             title: 'Mediu',                       desc: 'Autorizație mediu, emisii, substanțe periculoase.',             iconKey: 'environment'},
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces, camere, incidente.',                             iconKey: 'security'   },
  { href: '/administratie/subcontractori',    title: 'Subcontractori & Servicii',   desc: 'Contracte, evaluare, urmărire.',                                iconKey: 'partners'   },
  { href: '/administratie/documentatie',      title: 'Documentație tehnică',        desc: 'Fișe tehnice, manuale, instrucțiuni lucru.',                    iconKey: 'docs'       },
  { href: '/administratie/necalificati',      title: 'Muncitori necalificați',      desc: 'Pontaj, ture, echipamente protecție.',                          iconKey: 'cleaning'   },
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'IT producție/birou — continuitate și securitate.',              iconKey: 'network'    },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

const CARDS_COMERT: AdminCard[] = [
  { href: '/administratie/stocuri',           title: 'Gestiune stocuri',            desc: 'Inventar, intrări, ieșiri.',                                    iconKey: 'stock'      },
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare',               desc: 'Comenzi furnizori, recepție marfă.',                            iconKey: 'warehouse'  },
  { href: '/administratie/punct-vanzare',     title: 'Punct de vânzare',            desc: 'Case de marcat, rapoarte vânzări.',                             iconKey: 'pos'        },
  { href: '/administratie/merchandising',     title: 'Merchandising',               desc: 'Planograme, rafturi, prețuri, promoții.',                       iconKey: 'retail'     },
  { href: '/administratie/siguranta-prod',    title: 'Siguranța produselor',        desc: 'Trasabilitate, retrageri, date expirare.',                      iconKey: 'safety'     },
  { href: '/administratie/clienti',           title: 'Relații clienți',             desc: 'Reclamații, retururi, fidelizare.',                             iconKey: 'users'      },
  { href: '/administratie/logistica',         title: 'Logistică & Transport',       desc: 'Livrări, vehicule, rute.',                                      iconKey: 'transport'  },
  { href: '/administratie/mentenanta',        title: 'Mentenanță',                  desc: 'Echipamente, instalații, climatizare.',                         iconKey: 'maintenance'},
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'IT magazin/birou — continuitate și securitate.',                iconKey: 'network'    },
  { href: '/administratie/curatenie',         title: 'Curățenie',                   desc: 'Spații vânzare, depozit, vestiare.',                            iconKey: 'cleaning'   },
  { href: '/administratie/energie',           title: 'Energie & Utilități',         desc: 'Consum, optimizare, raportare.',                                iconKey: 'energy'     },
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces, antiefracție, camere.',                          iconKey: 'security'   },
  { href: '/administratie/autorizatii',       title: 'Autorizații & Avize',         desc: 'Comercializare, sanitar-veterinar, ANSVSA.',                    iconKey: 'permit'     },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

const CARDS_IT: AdminCard[] = [
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'LAN/Wi-Fi/VPN/Firewall — continuitate și securitate.',           iconKey: 'network'    },
  { href: '/administratie/securitate-cyber',  title: 'Securitate cibernetică',      desc: 'Incidente, vulnerabilități, acces.',                            iconKey: 'security'   },
  { href: '/administratie/echipamente-it',    title: 'Echipamente IT',              desc: 'Inventar, garanții, service.',                                  iconKey: 'equipment'  },
  { href: '/administratie/helpdesk',          title: 'Helpdesk',                    desc: 'Tichete, suport intern, SLA.',                                  iconKey: 'headset'    },
  { href: '/administratie/backup',            title: 'Backup & Recuperare',         desc: 'Politici, testare, monitorizare.',                              iconKey: 'backup'     },
  { href: '/administratie/licente',           title: 'Licențe software',            desc: 'Evidență, reînnoire, conformare.',                              iconKey: 'docs'       },
  { href: '/administratie/cloud',             title: 'Cloud & SaaS',                desc: 'Gestiune abonamente, costuri, utilizare.',                      iconKey: 'cloud'      },
  { href: '/administratie/continuitate',      title: 'Continuitate activitate',     desc: 'Planuri DR, RTO/RPO, testare failover.',                        iconKey: 'checklist'  },
  { href: '/administratie/gdpr',              title: 'GDPR & Protecția datelor',    desc: 'Registru prelucrări, incidente, DPO.',                          iconKey: 'shield'     },
  { href: '/administratie/monitorizare',      title: 'Monitorizare sisteme',        desc: 'Uptime, alerte, rapoarte disponibilitate.',                     iconKey: 'monitor'    },
  { href: '/administratie/audit-it',          title: 'Audit IT',                    desc: 'Verificări periodice, conformare ISO 27001.',                   iconKey: 'audit'      },
  { href: '/administratie/energie',           title: 'Energie & Infrastructură',    desc: 'UPS, datacenter, climatizare server room.',                     iconKey: 'energy'     },
  { href: '/administratie/documentatie',      title: 'Documentație tehnică',        desc: 'Arhitecturi, proceduri, manuale.',                              iconKey: 'docs'       },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte IT',                 desc: 'Implementări, migrații, upgrade-uri.',                          iconKey: 'projects'   },
];

const CARDS_TRANSPORT: AdminCard[] = [
  { href: '/administratie/parc-auto',         title: 'Parc auto',                   desc: 'Evidență vehicule, ITP, asigurări, roviniete.',                 iconKey: 'transport'  },
  { href: '/administratie/soferi',            title: 'Șoferi',                      desc: 'Permise, avize medicale, instruiri, pontaj.',                   iconKey: 'users'      },
  { href: '/administratie/rute',              title: 'Rute & Curse',                desc: 'Planificare, urmărire, optimizare.',                            iconKey: 'planning'   },
  { href: '/administratie/gps',               title: 'GPS & Monitorizare',          desc: 'Tracking vehicule, rapoarte traseu, viteze.',                   iconKey: 'monitor'    },
  { href: '/administratie/mentenanta',        title: 'Mentenanță vehicule',         desc: 'Revizie, reparații, service.',                                  iconKey: 'maintenance'},
  { href: '/administratie/combustibil',       title: 'Combustibil',                 desc: 'Consum, bonuri, raportare.',                                    iconKey: 'energy'     },
  { href: '/administratie/depozit',           title: 'Depozit & Marfă',             desc: 'Gestiune, recepție, expediere.',                                iconKey: 'warehouse'  },
  { href: '/administratie/documente-transp',  title: 'Documente transport',         desc: 'CMR, avize însoțire, declarații vamale.',                       iconKey: 'docs'       },
  { href: '/administratie/adr',               title: 'Conformare ADR',              desc: 'Transport mărfuri periculoase, autorizații, instruiri.',        iconKey: 'permit'     },
  { href: '/administratie/subcontractori',    title: 'Subcontractori transport',    desc: 'Contracte, evaluare, urmărire curse.',                          iconKey: 'partners'   },
  { href: '/administratie/clienti',           title: 'Clienți & Livrări',           desc: 'Urmărire livrări, reclamații, confirmări recepție.',            iconKey: 'users'      },
  { href: '/administratie/deseuri',           title: 'Deșeuri',                     desc: 'Ambalaje, uleiuri uzate, anvelope, raportare.',                 iconKey: 'waste'      },
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces depozit, camere, antiefracție.',                  iconKey: 'security'   },
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'IT birou/depozit — continuitate și securitate.',                iconKey: 'network'    },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

const CARDS_SERVICII: AdminCard[] = [
  { href: '/administratie/proiecte',          title: 'Proiecte & Contracte',        desc: 'Gestiune proiecte, termene, livrabile.',                        iconKey: 'projects'   },
  { href: '/administratie/clienti',           title: 'Clienți',                     desc: 'Evidență, comunicare, satisfacție, reclamații.',                iconKey: 'users'      },
  { href: '/administratie/facturare',         title: 'Facturare & Financiar',       desc: 'Facturi, încasări, restanțe.',                                  iconKey: 'finance'    },
  { href: '/administratie/helpdesk',          title: 'Helpdesk intern',             desc: 'Suport echipă, tichete, SLA.',                                  iconKey: 'headset'    },
  { href: '/administratie/gdpr',              title: 'GDPR & Conformare',           desc: 'Registru prelucrări, incidente, politici.',                     iconKey: 'shield'     },
  { href: '/administratie/licente',           title: 'Licențe & Abonamente',        desc: 'Software, reînnoire, costuri.',                                 iconKey: 'docs'       },
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'LAN/Wi-Fi/VPN/Firewall — continuitate și securitate.',           iconKey: 'network'    },
  { href: '/administratie/securitate-cyber',  title: 'Securitate cibernetică',      desc: 'Acces, vulnerabilități, audit.',                                iconKey: 'security'   },
  { href: '/administratie/documente',         title: 'Documente & Arhivă',          desc: 'Contracte, acte, versiuni, arhivare.',                          iconKey: 'docs'       },
  { href: '/administratie/furnizori',         title: 'Furnizori & Achiziții',       desc: 'Contracte, evaluare, reînnoire.',                               iconKey: 'partners'   },
  { href: '/administratie/energie',           title: 'Energie & Utilități',         desc: 'Consum birou, optimizare, raportare.',                          iconKey: 'energy'     },
  { href: '/administratie/audit-intern',      title: 'Audit intern',                desc: 'Verificări periodice, neconformități, acțiuni corective.',      iconKey: 'audit'      },
  { href: '/administratie/mentenanta',        title: 'Mentenanță birou',            desc: 'Echipamente, instalații, consumabile.',                         iconKey: 'maintenance'},
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

const CARDS_EDUCATIE: AdminCard[] = [
  { href: '/administratie/sali',              title: 'Săli & Spații',               desc: 'Gestiune săli, rezervări, capacitate, dotări.',                 iconKey: 'building'   },
  { href: '/administratie/personal-didactic', title: 'Personal didactic',           desc: 'Pontaj, norme, evaluări, formare continuă.',                    iconKey: 'users'      },
  { href: '/administratie/personal-aux',      title: 'Personal auxiliar',           desc: 'Administrativ, îngrijitori, pază, pontaj.',                     iconKey: 'users'      },
  { href: '/administratie/elevi',             title: 'Elevi / Studenți',            desc: 'Evidență, prezență, documente.',                                iconKey: 'users'      },
  { href: '/administratie/cantina',           title: 'Cantină & Alimentație',       desc: 'Meniu, alergeni, HACCP, aprovizionare.',                        iconKey: 'kitchen'    },
  { href: '/administratie/mentenanta',        title: 'Mentenanță',                  desc: 'Clădiri, echipamente, mobilier, instalații.',                   iconKey: 'maintenance'},
  { href: '/administratie/curatenie',         title: 'Curățenie & Igienizare',      desc: 'Spații, protocoale, consumabile.',                              iconKey: 'cleaning'   },
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'LAN/Wi-Fi/VPN, laboratoare IT, securitate.',                    iconKey: 'network'    },
  { href: '/administratie/documente',         title: 'Documente & Arhivă',          desc: 'Acte studii, contracte, registre, arhivare.',                   iconKey: 'docs'       },
  { href: '/administratie/achizitii',         title: 'Achiziții publice',           desc: 'Proceduri, contracte, urmărire.',                               iconKey: 'stock'      },
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces, camere, protocol urgențe.',                      iconKey: 'security'   },
  { href: '/administratie/energie',           title: 'Energie & Utilități',         desc: 'Consum, optimizare, raportare.',                                iconKey: 'energy'     },
  { href: '/administratie/gdpr',              title: 'GDPR & Conformare',           desc: 'Date elevi/studenți, registre, politici.',                      iconKey: 'shield'     },
  { href: '/administratie/autorizatii',       title: 'Autorizații & Avize',         desc: 'ISU, sanitar, ARACIP/ARACIS, mediu.',                           iconKey: 'permit'     },
  { href: '/administratie/audit-intern',      title: 'Audit intern',                desc: 'Verificări periodice, neconformități, acțiuni corective.',      iconKey: 'audit'      },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Renovări, fonduri europene, situații excepționale.',            iconKey: 'projects'   },
];

const CARDS_FINANCIAR: AdminCard[] = [
  { href: '/administratie/operatiuni',        title: 'Operațiuni zilnice',          desc: 'Registre, rapoarte, reconcilieri, trezorerie.',                 iconKey: 'finance'    },
  { href: '/administratie/clienti',           title: 'Clienți & Conturi',           desc: 'Evidență, KYC, documente, actualizări.',                        iconKey: 'users'      },
  { href: '/administratie/conformare-reg',    title: 'Conformare & Reglementare',   desc: 'BNR, ASF, raportări periodice, audit.',                         iconKey: 'compliance' },
  { href: '/administratie/risc',              title: 'Risc & Control intern',       desc: 'Evaluare riscuri, incidente, măsuri corective.',                iconKey: 'shield'     },
  { href: '/administratie/securitate-cyber',  title: 'Securitate cibernetică',      desc: 'Acces sisteme, fraude, incidente, audit.',                      iconKey: 'security'   },
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'Infrastructură IT, continuitate, backup.',                      iconKey: 'network'    },
  { href: '/administratie/gdpr',              title: 'GDPR & Protecția datelor',    desc: 'Registre, incidente, DPO, politici.',                           iconKey: 'shield'     },
  { href: '/administratie/documente',         title: 'Documente & Arhivă',          desc: 'Contracte, acte, versiuni, arhivare electronică.',              iconKey: 'docs'       },
  { href: '/administratie/continuitate',      title: 'Continuitate activitate',     desc: 'Planuri DR, RTO/RPO, testare failover.',                        iconKey: 'checklist'  },
  { href: '/administratie/securitate',        title: 'Securitate fizică & Pază',    desc: 'Control acces, camere, seifuri, protocol.',                     iconKey: 'security'   },
  { href: '/administratie/autorizatii',       title: 'Autorizații & Avize',         desc: 'Licențe BNR/ASF, reînnoire, raportări obligatorii.',            iconKey: 'permit'     },
  { href: '/administratie/audit-intern',      title: 'Audit intern',                desc: 'Verificări periodice, neconformități, acțiuni corective.',      iconKey: 'audit'      },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Implementări, migrații, situații excepționale.',                iconKey: 'projects'   },
];

const CARDS_AGRICULTURA: AdminCard[] = [
  { href: '/administratie/terenuri',          title: 'Terenuri & Parcele',          desc: 'Evidență, arendă, cadastru, rotație culturi.',                  iconKey: 'land'       },
  { href: '/administratie/culturi',           title: 'Culturi & Producție',         desc: 'Planificare, semănat, recoltat, randament.',                    iconKey: 'production' },
  { href: '/administratie/utilaje',           title: 'Utilaje agricole',            desc: 'Evidență, ITP, revizie, consum combustibil.',                   iconKey: 'equipment'  },
  { href: '/administratie/depozitare',        title: 'Depozitare & Silozuri',       desc: 'Gestiune stocuri, umiditate, temperaturi.',                     iconKey: 'warehouse'  },
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare & Input-uri',   desc: 'Semințe, îngrășăminte, pesticide, stocuri.',                    iconKey: 'stock'      },
  { href: '/administratie/animale',           title: 'Animale & Zootehnie',         desc: 'Evidență efectiv, sănătate, furajare, producție.',              iconKey: 'animal'     },
  { href: '/administratie/irigatie',          title: 'Irigații & Utilități',        desc: 'Consum apă, energie, sistem irigații.',                         iconKey: 'energy'     },
  { href: '/administratie/fitosanitar',       title: 'Fitosanitar & Tratamente',    desc: 'Registru tratamente, produse, intervale pauză.',                iconKey: 'safety'     },
  { href: '/administratie/subventii',         title: 'Documente & Subvenții',       desc: 'APIA, cereri, raportări, conformare.',                          iconKey: 'docs'       },
  { href: '/administratie/transport',         title: 'Transport & Logistică',       desc: 'Vehicule, livrări, export, trasabilitate.',                     iconKey: 'transport'  },
  { href: '/administratie/mediu-agri',        title: 'Mediu & Sustenabilitate',     desc: 'Sol, apă, emisii, practici agricole durabile.',                 iconKey: 'environment'},
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces, camere, antiefracție depozite.',                 iconKey: 'security'   },
  { href: '/administratie/audit-intern',      title: 'Audit intern',                desc: 'Verificări periodice, neconformități, acțiuni corective.',      iconKey: 'audit'      },
  { href: '/administratie/autorizatii',       title: 'Autorizații & Avize',         desc: 'Mediu, fitosanitar, veterinar, export.',                        iconKey: 'permit'     },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

const CARDS_SANATATE: AdminCard[] = [
  { href: '/administratie/programari',        title: 'Programări & Agenda',         desc: 'Gestiune programări, liste așteptare, confirmare.',             iconKey: 'calendar'   },
  { href: '/administratie/pacienti',          title: 'Pacienți',                    desc: 'Evidență, fișe, documente, confidențialitate.',                 iconKey: 'users'      },
  { href: '/administratie/personal-med',      title: 'Personal medical',            desc: 'Pontaj, competențe, avize, formare continuă.',                  iconKey: 'users'      },
  { href: '/administratie/echip-medicale',    title: 'Echipamente medicale',        desc: 'Verificări, etalonări, service, ISCIR.',                        iconKey: 'equipment'  },
  { href: '/administratie/sterilizare',       title: 'Sterilizare & Igienizare',    desc: 'Protocoale, consumabile, verificări.',                          iconKey: 'cleaning'   },
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare & Stocuri',     desc: 'Medicamente, materiale sanitare, inventar.',                    iconKey: 'stock'      },
  { href: '/administratie/facturare',         title: 'Facturare & Decontare',       desc: 'CNAS, pacienți privați, raportări.',                            iconKey: 'finance'    },
  { href: '/administratie/deseuri-med',       title: 'Deșeuri medicale',            desc: 'Gestiune, colectare, eliminare, raportare.',                    iconKey: 'waste'      },
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'IT cabinet/clinică, securitate, backup.',                       iconKey: 'network'    },
  { href: '/administratie/gdpr',              title: 'GDPR & Confidențialitate',    desc: 'Date medicale, registre, politici.',                            iconKey: 'shield'     },
  { href: '/administratie/autorizatii',       title: 'Autorizații & Avize',         desc: 'MSP, DSP, ISU, sanitar, mediu.',                                iconKey: 'permit'     },
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces, camere, protocol urgențe.',                      iconKey: 'security'   },
  { href: '/administratie/energie',           title: 'Energie & Utilități',         desc: 'Consum, optimizare, generatoare.',                              iconKey: 'energy'     },
  { href: '/administratie/audit-intern',      title: 'Audit intern',                desc: 'Verificări periodice, neconformități, acțiuni corective.',      iconKey: 'audit'      },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Renovări, situații excepționale, escaladări.',                  iconKey: 'projects'   },
];

const CARDS_ALTELE: AdminCard[] = [
  { href: '/administratie/mentenanta',        title: 'Mentenanță',                  desc: 'Echipamente, clădiri, instalații, revizie.',                    iconKey: 'maintenance'},
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'LAN/Wi-Fi/VPN/Firewall, securitate IT.',                        iconKey: 'network'    },
  { href: '/administratie/curatenie',         title: 'Curățenie & Igienizare',      desc: 'Spații, protocoale, consumabile.',                              iconKey: 'cleaning'   },
  { href: '/administratie/aprovizionare',     title: 'Aprovizionare & Stocuri',     desc: 'Comenzi, recepție, inventar.',                                  iconKey: 'stock'      },
  { href: '/administratie/documente',         title: 'Documente & Arhivă',          desc: 'Contracte, acte, versiuni, arhivare.',                          iconKey: 'docs'       },
  { href: '/administratie/clienti',           title: 'Clienți & Relații',           desc: 'Evidență, comunicare, reclamații, satisfacție.',                iconKey: 'users'      },
  { href: '/administratie/furnizori',         title: 'Furnizori & Contracte',       desc: 'Evaluare, reînnoire, negocieri.',                               iconKey: 'partners'   },
  { href: '/administratie/securitate',        title: 'Securitate & Pază',           desc: 'Control acces, camere, antiefracție.',                          iconKey: 'security'   },
  { href: '/administratie/energie',           title: 'Energie & Utilități',         desc: 'Consum, optimizare, raportare.',                                iconKey: 'energy'     },
  { href: '/administratie/gdpr',              title: 'GDPR & Conformare',           desc: 'Registre, politici, incidente.',                                iconKey: 'shield'     },
  { href: '/administratie/facturare',         title: 'Facturare & Financiar',       desc: 'Facturi, încasări, restanțe.',                                  iconKey: 'finance'    },
  { href: '/administratie/autorizatii',       title: 'Autorizații & Avize',         desc: 'Specifice domeniului, reînnoire, raportări.',                   iconKey: 'permit'     },
  { href: '/administratie/audit-intern',      title: 'Audit intern',                desc: 'Verificări periodice, neconformități, acțiuni corective.',      iconKey: 'audit'      },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte & Urgențe',          desc: 'Situații excepționale, escaladări.',                            iconKey: 'projects'   },
];

// ----------------------------------------------------------------
// MAP CENTRAL
// ----------------------------------------------------------------
export const ADMIN_CARDS_CONFIG: Record<CategorieActivitate, AdminCard[]> = {
  horeca:                CARDS_HORECA,
  constructii:           CARDS_CONSTRUCTII,
  productie:             CARDS_PRODUCTIE,
  comert:                CARDS_COMERT,
  it:                    CARDS_IT,
  transport:             CARDS_TRANSPORT,
  servicii_profesionale: CARDS_SERVICII,
  educatie:              CARDS_EDUCATIE,
  financiar:             CARDS_FINANCIAR,
  agricultura:           CARDS_AGRICULTURA,
  sanatate:              CARDS_SANATATE,
  altele:                CARDS_ALTELE,
};

/**
 * Returnează cardurile pentru o combinație org_type + categorie.
 * Spitalele au întotdeauna cardurile lor specifice indiferent de categorie.
 */
export function getAdminCards(
  orgType: string | null,
  categorie: CategorieActivitate | null
): AdminCard[] {
  if (orgType === 'spital') {
    return ADMIN_CARDS_SPITAL;
  }
  if (!categorie || !ADMIN_CARDS_CONFIG[categorie]) {
    return ADMIN_CARDS_CONFIG['altele'];
  }
  return ADMIN_CARDS_CONFIG[categorie];
}

// Carduri spital — păstrate separat pentru claritate
const ADMIN_CARDS_SPITAL: AdminCard[] = [
  { href: '/administratie/bucatarie',         title: 'Bucătărie / Nutriție',        desc: 'HACCP, temperaturi, igienizare, alergeni.',                     iconKey: 'kitchen'    },
  { href: '/administratie/mentenanta',        title: 'Mentenanță',                  desc: 'Runde tehnice, generatoare, frigotehnie.',                      iconKey: 'maintenance'},
  { href: '/administratie/retelistica',       title: 'Rețelistică',                 desc: 'LAN/Wi-Fi/VPN/Firewall — continuitate și securitate.',           iconKey: 'network'    },
  { href: '/administratie/necalificati',      title: 'Necalificați',                desc: 'Curățenie spații comune, aprovizionare.',                       iconKey: 'cleaning'   },
  { href: '/administratie/centralist',        title: 'Centrală telefonică',         desc: 'Flux apeluri interne, registre, alerte.',                       iconKey: 'headset'    },
  { href: '/administratie/heliport',          title: 'Heliport',                    desc: 'Verificări pistă, iluminat, proceduri.',                        iconKey: 'heliport'   },
  { href: '/administratie/proiecte-urgente',  title: 'Proiecte și Urgențe',         desc: 'Renovări, reparații majore, proiecte în curs.',                 iconKey: 'projects'   },
];