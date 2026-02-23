const domainsData = {
  "domenii": [
    {
      "id": "medical",
      "nume": "Domeniul Medical",
      "culoare": "#007AAD",
          "subdomenii": [
                  { id: "upu", nume: "UPU - Unitate Primiri Urgențe", score: 68 },
                  { id: "ati", nume: "ATI - Anestezie și Terapie Intensivă", score: 57 },
                  { id: "bloc_operator", nume: "Bloc operator", score: 73 },
                  { id: "chir_general", nume: "Chirurgie generală", score: 71 },
                  { id: "ortopedie", nume: "Chirurgie ortopedică", score: 76 },
                  { id: "cardio_chir", nume: "Chirurgie cardiovasculară", score: 72 },
                  { id: "neurochir", nume: "Neurochirurgie", score: 64 },
                  { id: "obst_gineco", nume: "Obstetrică - Ginecologie", score: 82 },
                  { id: "sala_nasteri", nume: "Sala nașteri", score: 80 },
                  { id: "neonatologie", nume: "Neonatologie", score: 79 },
                  { id: "pediatrie", nume: "Pediatrie", score: 74 },
                  { id: "med_int", nume: "Medicină internă", score: 63 },
                  { id: "cardiologie", nume: "Cardiologie", score: 84 },
                  { id: "neurologie", nume: "Neurologie", score: 69 },
                  { id: "psihiatrie", nume: "Psihiatrie", score: 61 },
                  { id: "oncologie", nume: "Oncologie", score: 66 },
                  { id: "hematologie", nume: "Hematologie", score: 67 },
                  { id: "gastro", nume: "Gastroenterologie", score: 70 },
                  { id: "nefrologie", nume: "Nefrologie/Dializă", score: 76 },
                  { id: "endocrino", nume: "Endocrinologie", score: 71 },
                  { id: "diabet", nume: "Diabet, nutriție și boli metabolice", score: 73 },
                  { id: "reumatologie", nume: "Reumatologie", score: 65 },
                  { id: "dermato", nume: "Dermatologie", score: 69 },
                  { id: "orl", nume: "ORL", score: 77 },
                  { id: "oftalmo", nume: "Oftalmologie", score: 83 },
                  { id: "pneumo", nume: "Pneumologie", score: 68 },
                  { id: "boli_infectioase", nume: "Boli infecțioase", score: 58 },
                  { id: "imagistica", nume: "Imagistică medicală", score: 88 },
                  { id: "lab", nume: "Laborator analize medicale", score: 86 },
                  { id: "anatomie_patologica", nume: "Anatomie patologică", score: 72 },
                  { id: "recuperare", nume: "Recuperare medicală / Balneo", score: 74 },
                  { id: "ambulator", nume: "Ambulator integrat / Policlinică", score: 79 }
              ]
    },
    {
      "id": "siguranta",
      "nume": "Siguranță & Securitate",
      "culoare": "#FF7F0E",
      "subdomenii": [
        { "id": "ssm", "nume": "SSM - Securitate și Sănătate în Muncă", "score": 72 },
        { "id": "psi", "nume": "PSI - Prevenirea și Stingerea Incendiilor", "score": 63 },
        { "id": "plan_evac", "nume": "Planuri de evacuare și urgență", "score": 80 },
        { "id": "securitate_fizica", "nume": "Securitate fizică (acces, CCTV)", "score": 78 },
        { "id": "control_infectii", "nume": "Controlul infecțiilor", "score": 67 },
        { "id": "sterilizare", "nume": "Sterilizare instrumentar medical", "score": 75 },
        { "id": "deseuri_periculoase", "nume": "Gestionarea deșeurilor periculoase", "score": 71 },
        { "id": "materiale_periculoase", "nume": "Materiale/substanțe periculoase", "score": 62 },
        { "id": "continuitate", "nume": "Plan de continuitate operațională", "score": 66 },
        { "id": "instruire_periodica", "nume": "Instruire periodică SSM/PSI", "score": 70 },
        { "id": "verificari_psi", "nume": "Verificări/REV instalații PSI", "score": 64 },
        { "id": "raportari_incidente", "nume": "Raportări și analiză incidente", "score": 59 }
      ]
    },
    {
      "id": "financiar",
      "nume": "Domeniul Financiar & Contabil",
      "culoare": "#2CA02C",
      "subdomenii": [
        { "id": "plan_bugetar", "nume": "Planificare bugetară anuală", "score": 81 },
        { "id": "executie_buget", "nume": "Execuție bugetară", "score": 77 },
        { "id": "raportare_fin", "nume": "Raportare financiară", "score": 83 },
        { "id": "achizitii", "nume": "Achiziții publice (SEAP)", "score": 65 },
        { "id": "cnas", "nume": "Contracte și deconturi CNAS", "score": 69 },
        { "id": "facturi", "nume": "Managementul facturilor", "score": 74 },
        { "id": "salarizare", "nume": "Salarizare personal", "score": 90 },
        { "id": "contabilitate", "nume": "Contabilitate financiară", "score": 86 },
        { "id": "audit_fin", "nume": "Audit financiar intern", "score": 72 },
        { "id": "cfp", "nume": "Control financiar preventiv", "score": 79 },
        { "id": "fonduri_ue", "nume": "Fonduri europene și granturi", "score": 58 },
        { "id": "cashflow", "nume": "Cashflow și prognoză", "score": 75 }
      ]
    },
    {
      "id": "management",
      "nume": "Management & Guvernanță",
      "culoare": "#9467BD",
      "subdomenii": [
        { "id": "plan_strategic", "nume": "Planificare strategică", "score": 82 },
        { "id": "management_risc", "nume": "Managementul riscurilor", "score": 68 },
        { "id": "politici_proc", "nume": "Politici și proceduri operaționale", "score": 85 },
        { "id": "audit_iso", "nume": "Audit intern & conformare ISO", "score": 74 },
        { "id": "iso9001", "nume": "Implementare ISO 9001", "score": 88 },
        { "id": "anmcs", "nume": "Evaluări ANMCS", "score": 71 },
        { "id": "legal", "nume": "Gestionare complianță legală", "score": 70 },
        { "id": "etica", "nume": "Comitet de etică", "score": 79 },
        { "id": "indicatori", "nume": "Raportare indicatori/KPI", "score": 76 },
        { "id": "satisfactie_pac", "nume": "Satisfacția pacienților", "score": 64 },
        { "id": "feedback_personal", "nume": "Feedback personal medical", "score": 73 },
        { "id": "comunicare", "nume": "Comunicare internă & externă", "score": 81 }
      ]
    },
    {
      "id": "logistica",
      "nume": "Domeniul Logistic & Tehnic",
      "culoare": "#D62728",
      "subdomenii": [
        { "id": "centrale_termice", "nume": "Centrale termice", "score": 78 },
        { "id": "hvac", "nume": "HVAC (ventilație/climatizare)", "score": 63 },
        { "id": "apa", "nume": "Alimentare cu apă", "score": 82 },
        { "id": "electricitate", "nume": "Alimentare cu energie electrică", "score": 80 },
        { "id": "gaze_medicale", "nume": "Rețea gaze medicale", "score": 71 },
        { "id": "mentenanta_biomed", "nume": "Mentenanță echipamente medicale", "score": 66 },
        { "id": "reparatii_cladiri", "nume": "Reparații clădiri/instalații", "score": 74 },
        { "id": "service_revizii", "nume": "Service & revizii tehnice", "score": 77 },
        { "id": "bloc_alimentar", "nume": "Bloc alimentar - bucătărie", "score": 69 },
        { "id": "spalatorie", "nume": "Spălătorie & curățătorie", "score": 62 },
        { "id": "depozit_medicale", "nume": "Depozitare materiale medicale", "score": 83 },
        { "id": "transport_intern", "nume": "Transport intern logistic", "score": 76 },
        { "id": "ambulante", "nume": "Ambulanțe (parc auto)", "score": 65 },
        { "id": "generatoare_ups", "nume": "Generatoare & UPS (backup)", "score": 86 }
      ]
    },
    {
      "id": "mediu",
      "nume": "Protecția Mediului & Sustenabilitate",
      "culoare": "#17BECF",
      "subdomenii": [
        { "id": "deseuri_periculoase_mediu", "nume": "Deșeuri periculoase (mediu)", "score": 72 },
        { "id": "deseuri_comune", "nume": "Deșeuri comune", "score": 81 },
        { "id": "emisii", "nume": "Emisii atmosferice", "score": 60 },
        { "id": "energie", "nume": "Consum și eficiență energetică", "score": 66 },
        { "id": "afm", "nume": "Raportare AFM", "score": 79 },
        { "id": "returo", "nume": "Raportare RetuRO", "score": 84 },
        { "id": "apa_uzata", "nume": "Management apă uzată", "score": 75 },
        { "id": "iso14001", "nume": "Implementare ISO 14001", "score": 88 },
        { "id": "amprenta_carbon", "nume": "Amprentă de carbon (ESG)", "score": 58 },
        { "id": "reach", "nume": "REACH – substanțe periculoase", "score": 64 }
      ]
    },
    {
      "id": "hr",
      "nume": "Resurse Umane & Training",
      "culoare": "#BCBD22",
      "subdomenii": [
        { "id": "recrutare", "nume": "Recrutare personal", "score": 73 },
        { "id": "angajare_dosare", "nume": "Angajare & dosare personal", "score": 82 },
        { "id": "fise_post", "nume": "Fișe de post", "score": 87 },
        { "id": "evaluari", "nume": "Evaluări de performanță", "score": 71 },
        { "id": "formare", "nume": "Formare profesională", "score": 65 },
        { "id": "training_conformitate", "nume": "Training ISO & conformitate", "score": 68 },
        { "id": "management_perf", "nume": "Managementul performanței", "score": 69 },
        { "id": "relatii_sindicale", "nume": "Relații sindicale", "score": 75 },
        { "id": "plan_cariera", "nume": "Plan de carieră & succesiune", "score": 62 },
        { "id": "pontaj", "nume": "Pontaj & prezență", "score": 86 },
        { "id": "ore_garda", "nume": "Plan ore de gardă", "score": 79 },
        { "id": "satisfactie_ang", "nume": "Satisfacția angajaților", "score": 66 }
      ]
    },
    {
      "id": "it",
      "nume": "IT & Securitate Cibernetică",
      "culoare": "#8C564B",
      "subdomenii": [
        { "id": "securitate_bd", "nume": "Securitate baze de date", "score": 78 },
        { "id": "gdpr", "nume": "Protecția datelor – GDPR", "score": 74 },
        { "id": "his", "nume": "Sistem HIS (Hospital IS)", "score": 71 },
        { "id": "erp", "nume": "ERP & integrări software", "score": 69 },
        { "id": "backup_dr", "nume": "Backup & Disaster Recovery", "score": 63 },
        { "id": "acces", "nume": "Managementul accesului", "score": 85 },
        { "id": "monitorizare", "nume": "Monitorizare atacuri (SIEM/EDR)", "score": 60 },
        { "id": "retea_servere", "nume": "Administrare rețea & servere", "score": 82 },
        { "id": "telemedicina", "nume": "Telemedicină & platforme online", "score": 77 },
        { "id": "patching", "nume": "Patching & actualizări", "score": 64 }
      ]
    }
  ]
};

export default domainsData;
