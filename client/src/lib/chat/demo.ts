import { normalize } from "@/lib/corpus";
import type { Hit } from "@/lib/chat/qdrant";
import type { Action, Block, Contradiction, AnswerStatus, Institution } from "@/types/chat";

// Scripted answers for the video demo. The agent replays a believable run
// (think → search → draft) with a fixed answer grounded in real indexed
// passages, so the recording never depends on model variance.

export type DemoAnswer = {
  status: AnswerStatus;
  answer: string;
  steps: { text: string; refs: number[] }[];
  institution: (Institution & { refs: number[] }) | null;
  missing: string[];
  contradictions: Contradiction[];
};

export type DemoScript = {
  match: (normalized: string) => boolean;
  queries: string[];
  hits: Hit[];
  answer: DemoAnswer;
  /** Shown above the answer, next to the status. */
  flags: Extract<Block, { type: "flag" }>[];
  /** Map lookup to use instead of the address, when the address finds the wrong places. */
  placesQuery?: string;
  actions?: Action[];
};

const hit = (h: Omit<Hit, "score" | "type"> & { type?: string }): Hit => ({
  type: "html",
  ...h,
  score: 0.7,
});

// Real chunks from the Qdrant index (autosalubritate.md), trimmed to the cited part.
const WASTE_HITS: Hit[] = [
  hit({
    n: 1,
    id: "476c720c-6e05-5dfa-bdcf-05096e7102f6",
    docId: "6e4db06131e8",
    title:
      "CHIȘINĂU - PRIMUL ORAȘ DIN ȚARĂ CU CEL MAI MARE COEFICIENT DE RECICLARE A DEȘEURILOR! - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/chisinau-primul-oras-din-tara-cu-cel-mai-mare-coeficient-de-reciclare-a-deseurilor",
    citeUrl:
      "https://autosalubritate.md/chisinau-primul-oras-din-tara-cu-cel-mai-mare-coeficient-de-reciclare-a-deseurilor/",
    date: "2023-01-17",
    text: `” va achita sortatorului 250 lei/tona (cu TVA).
Suma totală a contractului este de 217,5 mln lei (cu TVA), iar mijloacele vor fi achitate din resursele financiare ale Î.M. Regia „Autosalubritate”.
Dacă ați început să sortați vă rugăm să nu vă opriți ! Vă asigurăm că efortul DVS nu este zadarnic! Împreună vom sorta mai multe deșeuri, iar la depozitul de la Țânțăreni va ajunge mai puțin gunoi. Între timp, Primăria va identifica și dezvolta și alte soluții de sortare și reciclare, care vor permite majorarea coeficientului de sortare și reciclare a deșeurilor.`,
  }),
  hit({
    n: 2,
    id: "f1e53cd1-05b0-5262-9e20-3de03389281d",
    docId: "c79d47f91286",
    title: "VĂ ÎNDEMNĂM SĂ SORTAȚI CORECT DEȘEURILE GENERATE - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/va-indemnam-sa-sortati-corect-deseurile-generate",
    citeUrl: "https://autosalubritate.md/va-indemnam-sa-sortati-corect-deseurile-generate/",
    date: "2022-03-16",
    text: `Deșeurile trebuie aruncate în containerele special amenajate și etichetate pe fiecare fracție. Plasticul și metalul se pun în tomberonul galben, hârtia și cartonul în containerul albastru, sticla în cel de culoare verde, iar deșeurile biodegradabile în containerele zincate.
În total în oraș sunt amenajate 110 de platforme modulare și peste o mie de platforme simple de depozitare a deșeurilor. Deșeurile reciclabile sunt evacuate de autospecialele noastre pe gratis, separat, de obicei, de patru ori pe lună.`,
  }),
  hit({
    n: 3,
    id: "20ab1e89-f54c-54c4-9a0f-291d77654e48",
    docId: "ba629972b624",
    title:
      "TINEȚI CONT DE REGULILE DE SORTARE A DEȘEURILOR MUNICIPALE LA PLATFORMELE MODULARE ! - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/tineti-cont-de-regulile-de-sortare-a-deseurilor-municipale-la-platformele-modulare",
    citeUrl:
      "https://autosalubritate.md/tineti-cont-de-regulile-de-sortare-a-deseurilor-municipale-la-platformele-modulare/",
    date: "2022-09-08",
    text: `La aceste platforme, deșeurile generate trebuie stocate OBLIGATORIU în două fracții:
- DEȘEURI BIODEGRADABILE ;
- DEȘEURI RECICLABILE.
Toate resturile de mâncare trebuie aruncate în carcasa care este pentru deșeurile biodegradabile, iar plasticul, hârtia, cartonul sticla și ambalajele din metal (ambalajele de la conserve și băuturi) în carcasa unde este inscripția deșeuri reciclabile.`,
  }),
  hit({
    n: 4,
    id: "6cc49114-8fd4-52af-b1b4-2f20d3a77541",
    docId: "399dab2deece",
    title: "CONSULTĂRI PUBLICE - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/consultari-publice",
    citeUrl: "https://autosalubritate.md/consultari-publice/",
    date: "2025-05-14",
    text: `Sediul Î.M. Regia „Autosalubritate” (str. 27 martie 1918, nr. 14). Pentru informații suplimentare, ne puteți contacta la numerele de telefon: (022) 74-68-42 sau (022) 74-09-19.`,
  }),
];

const WASTE_ANSWER: DemoAnswer = {
  status: "found",
  answer: `**Nu există o astfel de plată și nici o cerere de depus.** Nicio sursă oficială a Primăriei sau a Î.M. Regia „Autosalubritate” nu menționează 200 de lei pe lună pentru locatarii care sortează deșeurile.

Banii legați de sortare nu merg la cetățeni, ci la operatorul de sortare: Regia „Autosalubritate” îi achită sortatorului 250 lei/tonă, din resursele proprii ale întreprinderii [1]. Pentru locatari, beneficiul este că deșeurile reciclabile sunt ridicate gratuit, separat, de obicei de patru ori pe lună [2], iar la depozitul de la Țânțăreni ajunge mai puțin gunoi [1].`,
  steps: [
    {
      text: "Nu completați „cereri” primite prin linkuri de pe Facebook sau Viber și nu trimiteți datele cardului, IBAN-ul sau copia buletinului.",
      refs: [],
    },
    {
      text: "La platforma cu tomberoane colorate: plasticul și metalul în tomberonul galben, hârtia și cartonul în cel albastru, sticla în cel verde.",
      refs: [2],
    },
    {
      text: "La platforma modulară: doar două fracții — reciclabile (plastic, hârtie, carton, sticlă, ambalaje metalice) și biodegradabile (resturi de mâncare).",
      refs: [3],
    },
    {
      text: "Pentru o confirmare oficială, sunați la Regia „Autosalubritate”.",
      refs: [4],
    },
  ],
  institution: {
    name: "Î.M. Regia „Autosalubritate”",
    address: "str. 27 Martie 1918, nr. 14, Chișinău",
    phone: "(022) 74-68-42",
    email: null,
    website: null,
    hours: null,
    refs: [4],
  },
  missing: [],
  contradictions: [],
};

const ROF_URL = "https://dgams.md/wp-content/uploads/2023/06/ROF_Serviciu_Transport-social-2.pdf";
const ACP_URL = "https://dgams.md/wp-content/uploads/2023/06/ACP-P.D-transport-social-6.pdf";

// Real chunks from the Qdrant index (dgams.md), trimmed to the cited part.
const TRANSPORT_HITS: Hit[] = [
  hit({
    n: 1,
    id: "19d27915-af9b-555e-819c-baf1e4922038",
    docId: "rof-transport-social",
    title: "Regulamentul Serviciului „Transport social” (proiect, 2023) — DGAMS",
    site: "dgams.md",
    url: ROF_URL,
    citeUrl: ROF_URL,
    type: "pdf",
    date: null,
    text: `Anexa nr. 1 la decizia Consiliului Municipal Chișinău nr.__________ din_______________2023
REGULAMENT de organizare și funcționarea a Serviciului „Transport social”
2. Serviciul „Transport social” reprezintă un serviciu social comunitar, prestat de către Direcţia generală asistenţă medicală şi socială a Consiliului Municipal Chişinău.
5. Servicii de transport social – servicii gratuite de transport adaptat pentru persoanele cu dizabilităţi şi persoanele în vârstă cu deficienţe locomotorii, imobilizate.
6. Serviciile de transport social includ: 1) transportul la instituţiile medicale (efectuarea consultaţiilor, investigaţiilor şi a tratamentelor de specialitate/ambulatoriu, şedinţelor de chimioterapie, radioterapie, dializă, internare/externare etc.)`,
  }),
  hit({
    n: 2,
    id: "6ebe0e70-def8-559d-b279-868a17744451",
    docId: "rof-transport-social",
    title: "Regulamentul Serviciului „Transport social” (proiect, 2023) — DGAMS",
    site: "dgams.md",
    url: ROF_URL,
    citeUrl: ROF_URL,
    type: "pdf",
    date: null,
    text: `10. Beneficiari ai Serviciului sunt persoanele cu dizabilităţii şi persoanele în vârstă cu deficienţe locomotorii, imobilizate, cu domiciliul legal în municipiul Chişinău, aflate la evidenţa Direcţiilor teritoriale de asistenţă socială.
11. Pentru a beneficia de Serviciu, solicitantul depune o cerere scrisă în adresa Prestatorului, sau prin referirea acestuia de către Direcţia teritorială de asistenţă socială. Cererea este însoţită de următoatele acte: 1) copia actului de identitate al solicitantului; 2) copia certificatului de încadrare în grad de dizabilitate; 3) copia legitimaţiei de pensionar.
12. Cererea se înregistrează în Registrul de evidenţă a solicitanţilor de transport social.
14. Programarea solicitanţilor, luaţi în evidenţă, se efectuează în baza ordinii de înscriere în Registrul de evidență a solicitanților de transport social, de către persoana responsabilă, desemnată prin ordinul Prestatorului, prin informarea telefonică a acestora.`,
  }),
  hit({
    n: 3,
    id: "e23e6129-8009-50c9-ad9e-4bd412ef7f78",
    docId: "e87008d1c1d6",
    title: "Anunț privind consultarea publică — proiectul de decizie „Transport social” — DGAMS",
    site: "dgams.md",
    url: ACP_URL,
    citeUrl: ACP_URL,
    type: "pdf",
    date: null,
    text: `Recomandările pe marginea proiectului de decizie supus consultării publice pot fi expediate până pe data de 06.07.2023, pe adresele: marina.buga@dgams.md, zinaida.plugari@dgams.md, anticamera@dgams.md, sau pe adresa str. M. Eminescu 42, Direcţia asistență socială din cadrul DGAMS.
Proiectul deciziei şi nota informativă sunt disponibile pe pagina web oficială a Primăriei municipiului Chișinău www.chisinau.md şi a Direcţiei www.dgams.md`,
  }),
  hit({
    n: 4,
    id: "24ca260b-b443-556a-90bd-94702224f294",
    docId: "e87008d1c1d6",
    title: "Anunț privind consultarea publică — proiectul de decizie „Transport social” — DGAMS",
    site: "dgams.md",
    url: ACP_URL,
    citeUrl: ACP_URL,
    type: "pdf",
    date: null,
    text: `DIRECŢIA GENERALĂ ASISTENŢĂ MEDICALĂ ȘI SOCIALĂ
str. Bucureşti nr. 35, municipiul Chişinău MD-2001, Republica Moldova
Tel./fax (+373 22) 22 80 84; www.dgams.md; e-mail: anticamera@dgams.md
Necesitatea elaborării şi adoptării proiectului de decizie este: asigurarea unui răspuns la necesitățile de transportare gratuită şi adaptată la instituțiile medicale sau instituții publice a persoanelor cu dizabilități și a celor în vârstă, cu deficiențe locomotorii, imobilizate.`,
  }),
  hit({
    n: 5,
    id: "c760aee9-e9c7-5afc-b6bf-da4037faeea0",
    docId: "2717db749d38",
    title: "Direcţia asistenţă socială Ciocana | DGAMS",
    site: "dgams.md",
    url: "https://dgams.md/directia-asistenta-sociala-ciocana",
    citeUrl: "https://dgams.md/directia-asistenta-sociala-ciocana/",
    date: null,
    text: `Direcţia asistenţă socială Ciocana
Numărul de contact: 022 78 27 75
Poșta Electronică: das.ciocana@dgams.md
Adresa: str. Mircea cel Bătrîn 5/2`,
  }),
];

const TRANSPORT_ANSWER: DemoAnswer = {
  status: "partial",
  answer: `**Da, există un serviciu gratuit pentru astfel de cazuri, dar nu pot confirma că funcționează acum.**

**Ce știu din documentele Primăriei:** Regulamentul Serviciului „Transport social” prevede transport **gratuit și adaptat** pentru persoanele cu dizabilități și persoanele în vârstă imobilizate, inclusiv la instituțiile medicale pentru „ședințe de chimioterapie, radioterapie, **dializă**, internare/externare” [1]. Serviciul este prestat de DGAMS, pentru persoanele cu domiciliul în Chișinău aflate la evidența direcției de asistență socială din sector [2].

**Ce NU știu:** în documente există doar **proiectul din 2023**. Regulamentul are antetul „nr. ______ din ______ 2023” [1], iar propunerile la consultarea publică se primeau până la **06.07.2023** [3]. Nu am găsit decizia adoptată, dacă serviciul funcționează în 2026 și nici un canal oficial de programare, așa că nu vă dau un răspuns inventat.

**Model orientativ de cerere** (nu este un formular oficial; regulamentul cere doar o cerere scrisă [2]). Îl puteți descărca completabil, în format Word, de mai jos:

> Către Direcția generală asistență medicală și socială, str. București 35, mun. Chișinău
>
> Subsemnatul/a **[numele dvs.]**, tel. **[telefon]**, solicit includerea mamei mele, **[numele mamei]**, domiciliată în mun. Chișinău, **[adresa]**, în Registrul de evidență a solicitanților Serviciului „Transport social”, pentru transport la ședințele de dializă (de 3 ori pe săptămână) la **[centrul de dializă]**.
>
> Anexez: copia actului de identitate, copia certificatului de încadrare în grad de dizabilitate, copia legitimației de pensionar.
>
> Data: **[data]** · Semnătura: **[semnătura]**`,
  steps: [
    {
      text: "Pregătiți actele: copia actului de identitate, copia certificatului de încadrare în grad de dizabilitate și copia legitimației de pensionar, plus cererea scrisă.",
      refs: [2],
    },
    {
      text: "Depuneți cererea la DGAMS, str. București 35 (tel. 022 22 80 84, anticamera@dgams.md), sau cereți referirea prin direcția de asistență socială din sectorul dvs.",
      refs: [2, 4],
    },
    {
      text: "Dacă locuiți în Ciocana: Direcția asistență socială Ciocana, str. Mircea cel Bătrîn 5/2, tel. 022 78 27 75, das.ciocana@dgams.md.",
      refs: [5],
    },
    {
      text: "La depunere, întrebați explicit: „Serviciul Transport social funcționează în 2026? Cum se face programarea?” Conform regulamentului, programarea se face în ordinea înscrierii în registru, iar persoana responsabilă vă anunță telefonic.",
      refs: [2],
    },
  ],
  institution: {
    name: "Direcția generală asistență medicală și socială (DGAMS)",
    address: "str. București 35, MD-2001, Chișinău",
    phone: "022 22 80 84",
    email: "anticamera@dgams.md",
    website: "https://dgams.md",
    hours: null,
    refs: [4],
  },
  missing: [
    "Decizia Consiliului Municipal care aprobă Serviciul „Transport social” (există doar proiectul din 2023)",
    "Dacă serviciul funcționează în 2026",
    "Un canal oficial de programare",
  ],
  contradictions: [],
};

const SCRIPTS: DemoScript[] = [
  {
    // "200 lei for sorting" rumour, in any close phrasing (Romanian or Russian).
    match: (q) => /(200|bani|compens|recompens|денег|деньги|выплат)/.test(q) && /(sort|recicl|сортир)/.test(q),
    queries: [
      "Primăria Chișinău oferă bani sau compensații locatarilor care sortează deșeurile?",
      "Cum se sortează deșeurile reciclabile și plasticul la platformele din curte?",
      "Care este adresa și numărul de telefon al Î.M. Regia „Autosalubritate”?",
    ],
    hits: WASTE_HITS,
    answer: WASTE_ANSWER,
    // The address lookup lands on unrelated offices; the website finds the Regia itself.
    placesQuery: "autosalubritate.md",
    flags: [
      {
        type: "flag",
        tone: "amber",
        title: "Atenție la mesajele care promit bani",
        text: "Primăria nu cere date bancare prin linkuri de pe Facebook sau Viber. Informația despre 200 de lei nu apare în nicio sursă oficială.",
      },
    ],
  },
  {
    // Free transport for an immobilised parent (dialysis), any close phrasing.
    match: (q) => /dializ|диализ/.test(q) || (/transport social/.test(q) && /(mama|tata|imobiliz|dizabil|deplas)/.test(q)),
    queries: [
      "Există transport gratuit pentru persoanele imobilizate care merg la dializă?",
      "Ce acte sunt necesare și unde se depune cererea pentru Serviciul „Transport social”?",
      "A fost aprobată decizia privind Serviciul „Transport social” și funcționează acum?",
      "Care este adresa și numărul de telefon al Direcției generale asistență medicală și socială (DGAMS)?",
    ],
    hits: TRANSPORT_HITS,
    answer: TRANSPORT_ANSWER,
    flags: [],
    // The website and the address both miss on the map; the full name finds DGAMS.
    placesQuery: "Direcția generală asistență medicală și socială",
    actions: [
      {
        label: "Descarcă modelul de cerere",
        href: "/modele/cerere-transport-social.docx",
        platform: "Word · de completat și depus la DGAMS",
      },
      { label: "Sunați la DGAMS", href: "tel:+37322228084", platform: "022 22 80 84" },
    ],
  },
];

export function findDemoScript(userText: string): DemoScript | null {
  const q = normalize(userText || "");
  return SCRIPTS.find((s) => s.match(q)) ?? null;
}
