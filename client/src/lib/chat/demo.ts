import { normalize } from "@/lib/corpus";
import type { Hit } from "@/lib/chat/qdrant";
import type { Block, Contradiction, AnswerStatus, Institution } from "@/types/chat";

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
};

const hit = (h: Omit<Hit, "score" | "docId" | "type"> & { docId: string }): Hit => ({
  ...h,
  score: 0.7,
  type: "html",
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
    flags: [
      {
        type: "flag",
        tone: "amber",
        title: "Atenție la mesajele care promit bani",
        text: "Primăria nu cere date bancare prin linkuri de pe Facebook sau Viber. Informația despre 200 de lei nu apare în nicio sursă oficială.",
      },
    ],
  },
];

export function findDemoScript(userText: string): DemoScript | null {
  const q = normalize(userText || "");
  return SCRIPTS.find((s) => s.match(q)) ?? null;
}
