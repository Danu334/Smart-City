# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Citizens (residents of Chișinău municipality)** asking about their rights, obligations, and procedures — permits, local taxes, public services, urban decisions, city programs. They arrive without knowing which document governs their case and may prefer either Romanian or Russian.
- **Municipal employees** who need fast, accurate lookups inside regulations, decisions, and procedures to answer citizen-facing questions consistently. Same corpus, professional usage pattern.

## Product Purpose

A municipal AI assistant for Chișinău City Hall that answers citizens' and employees' questions **from a defined corpus of public City Hall documents** — never from the model's imagination. Every answer names the exact document and passage it is based on; when the corpus lacks the information or documents contradict each other, the system says so explicitly instead of inventing an answer. Success is a citizen acting on a correct, verifiable answer in their own language.

## Positioning

Verifiable grounding: every answer is traceable to a specific document and passage inside the corpus, with explicit flags for missing information and contradictions. A generic chatbot — however fluent — cannot truthfully claim this. The mechanism, not the interface, is the product.

## Operating Context

- Built for a **challenge brief** (judged deliverable): must-have scope is grounded bilingual Q&A, citations, gap/contradiction flagging, website navigation, and a **monthly model-maintenance budget estimate** (external API vs. self-hosted model, deployment location, estimated monthly cost).
- Answers must be produced in **both Romanian and Russian**; either language is a first-class entry point, not a translation afterthought.
- The system routes users to the **relevant contact page on City Hall's website** when the corpus answer ends (e.g., where a procedure requires an office visit or a live human).
- Bonus scope: a feedback mechanism for users to rate answer quality/usefulness, and an innovative angle.
- The corpus is a **defined, real set of City Hall public documents** (confirmed by the user; composition and location still to be finalized).

## Capabilities and Constraints

- Grounded Q&A over the defined corpus: answers must quote or reference the governing passage, with document name/identifier and locatable passage reference.
- Bilingual output: Romanian and Russian for questions, answers, citations presentation, and UI copy.
- Explicit honesty states: (a) information not present in the corpus, (b) documents contradicting each other — both must be surfaced as first-class, designed states, not error strings.
- Website navigation: detect when a query maps to a City Hall web page (contacts, services) and route the user there.
- Budget estimate deliverable: comparison of external API vs. self-hosted model, chosen deployment location, estimated monthly cost.
- Undecided facts: exact corpus composition and storage format; backend architecture (no server exists yet — `client/` is the only code); deployment target; whether employees and citizens see one shared interface or role-specific entry points.

## Evidence on Hand

- `client/` — fresh, untouched React 19 + Vite scaffold (default template, no product code, no routing, no state library).
- No corpus files in the repository yet; the user confirms real City Hall documents exist and will be integrated.
- No logo, brand assets, or visual identity beyond the default Vite favicon. **Do not fabricate:** official City Hall branding, document citations, testimonials, statistics, or claims of official endorsement.

## Product Principles

1. **Evidence over eloquence.** A fluent answer without a document and passage is a failure, not an answer.
2. **Honesty is a feature, not an error path.** "Not in the corpus" and "documents disagree" are designed, dignified states.
3. **Two languages, one truth.** Romanian and Russian carry identical factual weight; citations remain identical across languages.
4. **End at the right door.** When self-serve ends, hand the user to the specific City Hall office or web page that can continue the case.
5. **The budget is part of the answer.** Sustainability (external API vs. self-hosted) is a judged deliverable, not an afterthought.

## Accessibility & Inclusion

- Full bilingual legibility: Romanian (Latin, diacritics) and Russian (Cyrillic) both require typographic support; no transliteration shortcuts.
- Plain-language answers for citizens without legal background, with the cited passage available for verification.
- No formal accessibility standard was set yet (to be decided with the stack/backend work).

## Annex 1 — List of Data Sources (links)

- http://chisinau.md
- https://www.chisinau.md/ro/transparenta
- https://suburbii.chisinau.md/
- https://proiecte.chisinau.md/
- https://mobilitatechisinau.md/
- https://rtec.md/
- https://autourban.md/ro/rute/suburbane
- https://exdrupo.md/
- https://dgaurf.md/
- https://dglca.md/
- https://autosalubritate.md/informatie-de-contact/
- https://www.acc.md/
- https://agsv.md/diagrama-defrisare-curatare-a-arborilor-2/
- https://chisinauedu.dgets.md/
- https://detsriscani.md/
- https://detsciocana.educ.md/
- https://detscentru.md/
- https://buiucanidets.md
- https://detsbotanica.md
- https://educatieonline.md/
- https://extrascolar.md/
- https://egradinita.md/
- https://escoala.chisinau.md/
- https://dgams.md/
- https://help.chisinau.md/
- https://amt-botanica.md/
- https://amt-centru.md/
- https://amtbuiucani.md/
- https://amt-ciocana.md/
- http://amtriscani.md/
- https://www.botanica.md/
- https://chisinaucentru.md/
- https://ciocana.md/
- https://rascani.md/
- https://preturabuiucani.md/
- https://comert.chisinau.md/
- https://visit.chisinau.md/
- https://invest.chisinau.md/
- https://proiecte.chisinau.md/ro/pv-289-startup-pentru-tineri-si-migranti
- https://e-tineret.md/
- http://www.infocom.md/
- https://liftservice.md/
