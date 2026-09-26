import { normalize } from "@/lib/corpus";
import type { Hit } from "@/lib/chat/qdrant";
import type { Action, Block, Contradiction, AnswerStatus, Institution } from "@/types/chat";

// Scripted answers for the video demo. The agent replays a believable run
// (think → search → draft) with a fixed answer grounded in real indexed
// passages, so the recording never depends on model variance.

export type DemoAnswer = {
  status: AnswerStatus;
  answer: string;
  documents: { text: string; quote: string; refs: number[] }[];
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
  /** Show a clock check before searching, for time-aware questions. */
  clock?: boolean;
  /** The same answer in Russian; the Romanian one is used otherwise. */
  ru?: { answer: DemoAnswer; actions?: Action[] };
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
  documents: [],
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
  documents: [
    { text: "Cerere scrisă către DGAMS (modelul de mai jos)", quote: "cerere scrisă", refs: [2] },
    {
      text: "Copia actului de identitate al solicitantului",
      quote: "copia actului de identitate al solicitantului",
      refs: [2],
    },
    {
      text: "Copia certificatului de încadrare în grad de dizabilitate",
      quote: "copia certificatului de încadrare în grad de dizabilitate",
      refs: [2],
    },
    { text: "Copia legitimației de pensionar", quote: "copia legitimaţiei de pensionar", refs: [2] },
  ],
  steps: [
    {
      text: "Completați cererea după modelul de mai jos și pregătiți actele din lista „Documente necesare”.",
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

// Real chunks from the Qdrant index (autosalubritate.md), trimmed to the cited part.
const TARIFF_HITS: Hit[] = [
  hit({
    n: 1,
    id: "8a856fcb-dd15-56c7-93cf-553916e60936",
    docId: "dispozitie-304-d",
    title:
      "Dispoziție cu privire la aprobarea tarifelor și a normelor de acumulare pentru colectarea, transportarea și depozitarea deșeurilor municipale din municipiul Chișinău - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/dispozitie-cu-privire-la-aprobarea-tarifelor-si-a-normelor-de-acumulare-pentru-colectarea-transportarea-si-depozitarea-deseurilor-municipale-din-municipiul-chisinau",
    citeUrl:
      "https://autosalubritate.md/dispozitie-cu-privire-la-aprobarea-tarifelor-si-a-normelor-de-acumulare-pentru-colectarea-transportarea-si-depozitarea-deseurilor-municipale-din-municipiul-chisinau/",
    // The page carries no date of its own; this is the date of the disposition it announces.
    date: "2022-07-07",
    text: `Anunțul publicat în Monitorul Oficial Nr 208-216 (8252-8260) PARTEA IV din 15 iulie 2022.
Î.M. Regia „Autosalubritate” informează că, începând cu 07.07.2022, sunt în vigoare tarifele pentru colectarea, transportarea și depozitarea deșeurilor din municipiul Chișinău, aprobate prin Dispoziția Primarului General al mun. Chișinău nr.304-d din 07.07.2022: pentru agenții economici – 210,00 lei/1 m3 (fără TVA), pentru populație – 105,00 lei/1 m3 (fără TVA) sau lunar 17,50 lei pentru un locatar la bloc și 35,00 lei pentru un locatar în sectorul particular.`,
  }),
  hit({
    n: 2,
    id: "f28026d6-c953-5555-9bc2-a14ab8e0b15d",
    docId: "cmc-ajustare-tarife-2022",
    title:
      "CMC A VOTAT AJUSTAREA TARIFELOR PENTRU COLECTAREA, TRANSPORTAREA ȘI DEPOZITAREA DEȘEURILOR MUNICIPALE DIN CHIȘINĂU - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/cmc-a-votat-ajustarea-tarifelor-pentru-colectarea-transportarea-si-depozitarea-deseurilor-municipale-din-chisinau",
    citeUrl:
      "https://autosalubritate.md/cmc-a-votat-ajustarea-tarifelor-pentru-colectarea-transportarea-si-depozitarea-deseurilor-municipale-din-chisinau/",
    date: "2022-06-21",
    text: `Din 1 iulie curent, serviciile pentru colectarea, transportarea și depozitarea deșeurilor municipale din Chișinău, vor fi facturate în corespundere cu noile tarife. Decizia a fost luată astăzi, 21 iunie, în cadrul ședinței consiliului municipal.
Costul pentru evacuarea unui 1 m3 de deșeuri pentru populația orașului Chișinău va constitui 105 lei fără TVA, iar plata lunară pentru evacuarea deșeurilor pentru persoanele fizice la bloc va constitui 17,50 lei, iar pentru cei care trăiesc la case particulare – 35 lei.
Totodată, pensionarii și familiile social vulnerabile din capitală vor beneficia de compensații la plata lunară pentru evacuarea deșeurilor pe care le generează.`,
  }),
  hit({
    n: 3,
    id: "aab69d5e-8242-52f2-ab6f-916dbd1bf991",
    docId: "cmc-ajustare-tarife-2022",
    title:
      "CMC A VOTAT AJUSTAREA TARIFELOR PENTRU COLECTAREA, TRANSPORTAREA ȘI DEPOZITAREA DEȘEURILOR MUNICIPALE DIN CHIȘINĂU - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/cmc-a-votat-ajustarea-tarifelor-pentru-colectarea-transportarea-si-depozitarea-deseurilor-municipale-din-chisinau",
    citeUrl:
      "https://autosalubritate.md/cmc-a-votat-ajustarea-tarifelor-pentru-colectarea-transportarea-si-depozitarea-deseurilor-municipale-din-chisinau/",
    date: "2022-06-21",
    text: `Precizăm, că ultima dată, tarifele pentru colectarea, transportarea și depozitarea deșeurilor municipale din Chișinău, au fost ajustate acum cinci ani în 2017.`,
  }),
  hit({
    n: 4,
    id: "7533777c-e981-5886-8338-979780c644a3",
    docId: "aducem-multumiri-2021",
    title:
      "Aducem mulțumiri și aprecieri, cetățenilor, care informează Regia ,,Autosalubritate’’, despre încălcarea și nerespectarea regulelor de salubrizare. - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/aducem-multumiri-si-aprecieri-cetatenilor-care-informeaza-regia-autosalubritate-despre-incalcarea-si-nerespectarea-regulelor-de-salubrizare",
    citeUrl:
      "https://autosalubritate.md/aducem-multumiri-si-aprecieri-cetatenilor-care-informeaza-regia-autosalubritate-despre-incalcarea-si-nerespectarea-regulelor-de-salubrizare/",
    date: "2021-05-21",
    text: `Respectați regulele de salubrizare și nu aruncați gunoiul la întîmplare.
Abonați-vă la serviciul de evacuare a deșeurilor din cardul Î.M Regia ,, Autosalubritate,, pentru a evita sancționarea, cu un tarif minim de 18,50 per persoană, în acest context, oamenii, nu vor mai arunca deşeurile la întâmplare, iar localităţile vor avea un aspect îngrijit.`,
  }),
  hit({
    n: 5,
    id: "66bbc467-5db5-501e-8e48-26eaa91377e2",
    docId: "contracte-februarie-2024",
    title: "Î.M. REGIA „AUTOSALUBRITATE” A ÎNCHEIAT ÎN LUNA FEBRUARIE 236 CONTRACTE - Regia AutoSalubritate",
    site: "autosalubritate.md",
    url: "https://autosalubritate.md/i-m-regia-autosalubritate-a-incheiat-in-luna-februarie-236-contracte",
    citeUrl: "https://autosalubritate.md/i-m-regia-autosalubritate-a-incheiat-in-luna-februarie-236-contracte/",
    date: "2024-03-11",
    text: `Pentru a deveni clientul Î.M. Regia „Autosalubritate” — Persoane fizice: Copia actului de proprietate; Buletinul de identitate; Numărul persoanelor ce locuiesc pe adresa indicată; Cerere.
Ulterior, întreg setul de acte pentru încheierea contractelor directe, privind evacuarea deșeurilor municipale, se va prezenta la sediul Întreprinderii, strada 27 Martie 1918, nr.14, de luni până vineri, între orele 08.00-16.30, pauza de masă 12.00-13.00, sau online.
Pentru mai multe informații, accesați https://autosalubritate.md/servicii/servicii-persoane-fizice/ sau sunați la numerele de telefon: 022-740-672 – secția contracte, 022-747-520 – dispecerat.`,
  }),
];

const TARIFF_ANSWER: DemoAnswer = {
  status: "contradiction",
  answer: `**Cel mai recent tarif publicat este 17,50 lei pe lună pentru un locatar la bloc** (35 lei pentru un locatar la casă particulară), în vigoare din **07.07.2022**, prin Dispoziția Primarului General nr. 304-d [1]. În volum, asta înseamnă 105 lei/m³ fără TVA pentru populație [1].

**De ce găsiți și 18,50 lei:** pe același site, un articol din **21.05.2021** vorbește despre „un tarif minim de 18,50 per persoană” [4]. Acest articol este anterior deciziei din 2022: Consiliul Municipal a votat ajustarea tarifelor pe 21.06.2022 [2], iar precedenta ajustare avusese loc în 2017 [3]. În plus, cele două cifre au unități diferite („per persoană” față de „pentru un locatar la bloc”), iar niciuna dintre pagini nu explică trecerea de la una la alta. **Considerați 18,50 lei o informație istorică.**

**Ce nu pot confirma:** în documente nu există o pagină cu tarifele din 2025–2026. Dacă tariful s-a schimbat după iulie 2022, sursele mele nu o arată, așa că verificați factura sau întrebați Regia.

Pensionarii și familiile social vulnerabile beneficiază de compensații la plata lunară [2].`,
  documents: [],
  steps: [
    {
      text: "Verificați pe factură tariful aplicat. Valoarea cunoscută din 07.07.2022: 17,50 lei/lună la bloc sau 35 lei/lună la casă particulară.",
      refs: [1],
    },
    {
      text: "Dacă sunteți pensionar sau familie social vulnerabilă, întrebați de compensația la plata lunară.",
      refs: [2],
    },
    {
      text: "Dacă locuiți la casă și nu aveți contract: pregătiți copia actului de proprietate, buletinul, numărul persoanelor care locuiesc la adresă și o cerere, apoi depuneți-le la sediul Regiei (luni–vineri, 08:00–16:30) sau online.",
      refs: [5],
    },
    {
      text: "Pentru tariful în vigoare azi, sunați la secția contracte: 022-740-672.",
      refs: [5],
    },
  ],
  institution: {
    name: "Î.M. Regia „Autosalubritate”",
    address: "str. 27 Martie 1918, nr. 14, Chișinău",
    phone: "022-740-672",
    email: null,
    website: "https://autosalubritate.md",
    hours: "Luni–vineri, 08:00–16:30 (pauză 12:00–13:00)",
    refs: [5],
  },
  missing: ["Tarifele în vigoare în 2025–2026 (cea mai recentă sursă este din iulie 2022)"],
  contradictions: [
    {
      topic: "Tariful lunar pentru evacuarea deșeurilor",
      claims: [
        { text: "17,50 lei/lună pentru un locatar la bloc, 35 lei la casă particulară — în vigoare din 07.07.2022 (cel mai recent)", ref: 1 },
        { text: "18,50 lei „per persoană” — articol din 21.05.2021 (informație istorică)", ref: 4 },
      ],
    },
  ],
};

const ACC_DISCONNECTIONS = "https://www.acc.md/disconnections";

// Real chunks from the Qdrant index (acc.md, crawled 25.09.2026), trimmed to the cited part.
const WATER_HITS: Hit[] = [
  hit({
    n: 1,
    id: "1a501b36-e317-5781-b792-dab0ee5187d0",
    docId: "6b26a29eba5a",
    title: "Deconectări — Sistări planificate — S.A. „Apă-Canal Chișinău”",
    site: "www.acc.md",
    url: ACC_DISCONNECTIONS,
    citeUrl: ACC_DISCONNECTIONS,
    date: "2026-09-25",
    text: `25.09.26 13:18
În intervalul 09:00 – 21:00, Joi, 1 Octombrie 2026, fără apă să fie consumatorii din: str. Mateevici 87, 66/1, 103, bd. B. Bodoni 1
În legătură cu executarea lucrărilor planificate de către S.A. „Apă-Canal Chişinău”. Rugăm toţi consumatorii afectaţi de această oprire să-şi asigure rezerva minimă de apă pentru consum şi uz casnic pe perioada întreruperii furnizării apei.
23.09.26 10:49
În legătura cu executarea lucrărilor planificate la apeduct, S.A. "Apă-Canal Chişinău” este nevoită să întrerupă furnizarea apei potabile Luni, de la ora 09:00, data de 28 Septembrie 2026 pînă la Marți la ora 15:00 data de 29 Septembrie 2026. Vor fi afectaţi de lipsa apei consumatorii din: str. Doina 189/...-203/.., str. Ankara 6, str. Ceucari 7 uzina de beton, Comuna Gratiești, s. Hulboaca`,
  }),
  hit({
    n: 2,
    id: "484a6ed9-22ea-5b89-b332-d5cdbd6b94a8",
    docId: "6b26a29eba5a",
    title: "Deconectări — Presiune joasă — S.A. „Apă-Canal Chișinău”",
    site: "www.acc.md",
    url: ACC_DISCONNECTIONS,
    citeUrl: ACC_DISCONNECTIONS,
    date: "2026-09-25",
    text: `22.09.26 16:14
Consumatorii de pe următoarele străzi: str. Petrarilor 4, 4/1, 6, 8, 8/1, str. Drumul Viilor 26, 28, 28/1, 28/2, 30/2.
Luni, 28 septembrie, 2026 și Marți, 29 septembrie în intervalul 9:00– 21:00, este posibilă deconectarea energiei electrice, un proces care va avea ca rezultat furnizarea de apă cu presiune joasă, în legătură cu executarea unor lucrări de către Î.C.S. „Premier Energy Distribution”.
22.09.26 16:00
str. I. Neculce 10, 12/1
Luni, 28 septembrie, 2026 în intervalul 9:00– 16:00, este posibilă deconectarea energiei electrice, un proces care va avea ca rezultat furnizarea de apă cu presiune joasă.`,
  }),
  hit({
    n: 3,
    id: "3a80df02-fd15-5db9-90b8-d57f7a588781",
    docId: "6b26a29eba5a",
    title: "Deconectări — Avarieri apeduct — S.A. „Apă-Canal Chișinău”",
    site: "www.acc.md",
    url: ACC_DISCONNECTIONS,
    citeUrl: ACC_DISCONNECTIONS,
    date: "2026-09-25",
    text: `Număr fişă | Adresa avarierii | Avariere | Depistat | Străzi afectate | Deconectat | Reconectare
Buiucani | 33311 | str. Vasile Lupu | 59/2 < Cor | Scurgere de sub asfalt | 25.09.2026 | Lupu, Cornului, Ghioceilor | 25.09.2026 15:00 | 25.09.2026 15:30`,
  }),
  hit({
    n: 4,
    id: "0a62fbed-b706-5e0b-8312-247b71b614d4",
    docId: "6b26a29eba5a",
    title: "Deconectări — Avarieri apeduct — S.A. „Apă-Canal Chișinău”",
    site: "www.acc.md",
    url: ACC_DISCONNECTIONS,
    citeUrl: ACC_DISCONNECTIONS,
    date: "2026-09-25",
    text: `Număr fişă | Adresa avarierii | Avariere | Depistat | Străzi afectate | Deconectat | Reconectare
Ialoveni | 33343 | str-la 1 Valeriu Cupcea | 9 | Scurgere din fintina | 25.09.2026 | Ial. Str-La Cupcea | 25.09.2026 16:40 | 25.09.2026 18:00`,
  }),
  hit({
    n: 5,
    id: "a1e31adc-43e4-56e6-b556-a3dd2b445689",
    docId: "acc-contacts",
    title: "Contacte — S.A. „Apă-Canal Chișinău”",
    site: "www.acc.md",
    url: "https://www.acc.md/contacts",
    citeUrl: "https://www.acc.md/contacts",
    date: null,
    text: `Date de contact
Adresa: Strada Albişoara 38, Chișinău, MD-2005
Program de lucru: Luni – Joi: 08:00 – 17:00; Vineri: 08:00 – 15:45; Pauza de masă: 12:00 – 12:45
E-mail: acc@acc.md
Şef Departamentul dispecerat: 0(22) 256 – 899
Departamentul dispecerat: 0(22) 25 – 66 – 66, 857 – 777`,
  }),
];

const WATER_ANSWER: DemoAnswer = {
  status: "found",
  answer: `**Nu știu la ce adresă este blocul dvs., așa că vă arăt toate sistările anunțate de S.A. „Apă-Canal Chișinău”** (pagina „Deconectări”, actualizată pe 25.09.2026). Verificați dacă strada dvs. apare mai jos.

**Sistări planificate — fără apă:**
- **Luni 28.09, 09:00 – marți 29.09, 15:00** (lucrări la apeduct): str. Doina 189–203, str. Ankara 6, str. Ceucari 7 (uzina de beton), com. Grătiești, s. Hulboaca [1]
- **Joi 01.10, 09:00 – 21:00** (lucrări planificate): str. Mateevici 87, 66/1, 103, bd. B. Bodoni 1 [1]

**Apă cu presiune joasă** (deconectări de energie electrică, Premier Energy Distribution):
- **Luni 28.09 și marți 29.09, 09:00 – 21:00**: str. Petrarilor 4, 4/1, 6, 8, 8/1; str. Drumul Viilor 26, 28, 28/1, 28/2, 30/2 [2]
- **Luni 28.09, 09:00 – 16:00**: str. I. Neculce 10, 12/1 [2]

**Avarii cu apa oprită (25.09.2026, apa a fost reluată):**
- str. Vasile Lupu, Cornului, Ghioceilor (Buiucani): 15:00 – 15:30 [3]
- Ialoveni, str-la Valeriu Cupcea: 16:40 – 18:00 [4]

Dacă adresa dvs. nu este în listă, poate fi o avarie nouă, care nu a apărut încă pe pagină. Sunați la dispeceratul Apă-Canal: **022 25-66-66** [5].`,
  documents: [],
  steps: [
    {
      text: "Căutați strada și numărul blocului în lista de mai sus.",
      refs: [1, 2],
    },
    {
      text: "Dacă blocul are o sistare planificată, faceți-vă o rezervă minimă de apă pentru perioada întreruperii.",
      refs: [1],
    },
    {
      text: "Dacă blocul nu este în listă, sunați la dispeceratul Apă-Canal (022 25-66-66) și spuneți adresa exactă.",
      refs: [5],
    },
  ],
  institution: {
    name: "S.A. „Apă-Canal Chișinău”",
    address: "str. Albișoara 38, MD-2005, Chișinău",
    phone: "022 25-66-66",
    email: "acc@acc.md",
    website: "https://www.acc.md",
    hours: "Luni–joi 08:00–17:00, vineri 08:00–15:45",
    refs: [5],
  },
  missing: [],
  contradictions: [],
};

const WATER_ANSWER_RU: DemoAnswer = {
  ...WATER_ANSWER,
  answer: `**Я не знаю адрес вашего дома, поэтому показываю все отключения, объявленные АО «Apă-Canal Chișinău»** (страница «Deconectări», обновлена 25.09.2026). Проверьте, есть ли ваша улица в списке ниже.

**Плановые отключения — без воды:**
- **Понедельник 28.09, 09:00 – вторник 29.09, 15:00** (работы на водопроводе): str. Doina 189–203, str. Ankara 6, str. Ceucari 7 (бетонный завод), коммуна Грэтиешть, с. Хулбоака [1]
- **Четверг 01.10, 09:00 – 21:00** (плановые работы): str. Mateevici 87, 66/1, 103, bd. B. Bodoni 1 [1]

**Низкое давление воды** (отключения электроэнергии, Premier Energy Distribution):
- **Понедельник 28.09 и вторник 29.09, 09:00 – 21:00**: str. Petrarilor 4, 4/1, 6, 8, 8/1; str. Drumul Viilor 26, 28, 28/1, 28/2, 30/2 [2]
- **Понедельник 28.09, 09:00 – 16:00**: str. I. Neculce 10, 12/1 [2]

**Аварии с отключением воды (25.09.2026, подача восстановлена):**
- str. Vasile Lupu, Cornului, Ghioceilor (Буюкань): 15:00 – 15:30 [3]
- Яловень, str-la Valeriu Cupcea: 16:40 – 18:00 [4]

Если вашего адреса нет в списке, возможно, это новая авария, которая ещё не появилась на странице. Позвоните в диспетчерскую Apă-Canal: **022 25-66-66** [5].`,
  steps: [
    { text: "Найдите улицу и номер дома в списке выше.", refs: [1, 2] },
    {
      text: "Если у дома плановое отключение, сделайте минимальный запас воды на время отключения.",
      refs: [1],
    },
    {
      text: "Если дома нет в списке, позвоните в диспетчерскую Apă-Canal (022 25-66-66) и назовите точный адрес.",
      refs: [5],
    },
  ],
  institution: {
    ...WATER_ANSWER.institution!,
    hours: "Пн–Чт 08:00–17:00, Пт 08:00–15:45",
  },
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
  {
    // Monthly waste fee: 18,50 vs 17,50 lei, any close phrasing.
    match: (q) =>
      /(salubr|gunoi|deseu)/.test(q) && /(17[,.]50|18[,.]50|tarif|cat (costa|platesc|plateste|se plateste))/.test(q),
    queries: [
      "Cât plătește lunar un locatar pentru evacuarea deșeurilor în Chișinău?",
      "Care sunt tarifele în vigoare pentru colectarea, transportarea și depozitarea deșeurilor municipale?",
      "Tariful de 18,50 lei per persoană pentru salubrizare mai este valabil?",
      "Care este adresa și numărul de telefon al Î.M. Regia „Autosalubritate”, secția contracte?",
    ],
    hits: TARIFF_HITS,
    answer: TARIFF_ANSWER,
    flags: [],
  },
  {
    // "Why is there no water in my building?", in Romanian or Russian.
    match: (q) =>
      (/\b(apa|apei)\b/.test(q) && /(nu (este|e|am|avem|curge)|lips|fara apa|sistar|deconect|oprit)/.test(q)) ||
      (/вод/.test(q) && /(нет|отключ|почему)/.test(q)),
    clock: true,
    queries: [
      "Unde este sistată livrarea apei potabile în Chișinău în zilele acestea?",
      "Deconectări planificate și avarii la apeduct S.A. „Apă-Canal Chișinău”",
      "Care este numărul de telefon al dispeceratului S.A. „Apă-Canal Chișinău”?",
    ],
    hits: WATER_HITS,
    answer: WATER_ANSWER,
    flags: [],
    placesQuery: "Apă-Canal Chișinău",
    actions: [{ label: "Sunați la dispeceratul Apă-Canal", href: "tel:+37322256666", platform: "022 25-66-66" }],
    ru: {
      answer: WATER_ANSWER_RU,
      actions: [{ label: "Позвонить в диспетчерскую Apă-Canal", href: "tel:+37322256666", platform: "022 25-66-66" }],
    },
  },
];

export function findDemoScript(userText: string): DemoScript | null {
  const q = normalize(userText || "");
  return SCRIPTS.find((s) => s.match(q)) ?? null;
}
