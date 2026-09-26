import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export const LOCALES = ["ro", "ru", "en"];
const STORAGE_KEY = "sc-locale";

const dictionaries = {
  en: {
    nav: {
      home: "Home",
      about: "About us",
      faq: "FAQ",
      signIn: "Sign in",
      signUp: "Sign up",
      greeting: "Hi, {name}",
      signOut: "Sign out",
      menu: "Menu",
      close: "Close menu",
      skip: "Skip to content",
      language: "Language",
    },
    guide: {
      name: "Victor · Your guide",
      next: "Next",
      done: "Got it",
      close: "Close",
      step: "Step {n} of {total}",
      back: "Back",
      off: "I'm an experienced user. Don't show the guide again.",
      launcher: "Guide",
      launch: "Start the guide with Victor",
      tours: {
        home: [
          "Hello! I'm Victor, a City Hall specialist. I'll help you find answers in the city's official documents.",
          "Type here everything you want to find out, for example about documents, taxes or permits. Then press “Ask”.",
        ],
        signIn: [
          "Hello! I'll help you sign in to your account in a few steps.",
          "Type the email and password you registered with. Press “Show” to see the password you typed. If you forgot it, press “Forgot password?”.",
          "Tick “Keep me signed in” if this is your own device, then press “Sign in”.",
          "Don't have an account yet? Press “Create an account”.",
        ],
        chat: [
          "Hello! Here you can ask questions about City Hall's documents. Let me show you quickly how it works.",
          "The conversation history (on a phone, the ☰ button at the top left) keeps earlier questions. Open the one about the family doctor to see a complete answer with sources.",
          "In answers, the small numbers like [1] are the sources. Press one and the document opens with the exact passage highlighted.",
          "Type your question here in your own words, then press “Send” or the Enter key.",
        ],
        signUp: [
          "Hello! Creating an account takes about a minute. I'll show you each step.",
          "First, choose who you are: a resident or a City Hall employee.",
          "Then write your full name, your email and a password of at least 8 characters. The coloured bar shows how strong the password is.",
          "Choose the language you want your answers in: Romanian or Russian.",
          "Finally, tick both confirmation boxes and press “Create account”. That's it!",
        ],
      },
    },
    sponsor: { label: "Challenge by", name: "Chișinău City Hall" },
    privacy: {
      title: "Privacy policy",
      updated: "Updated 26 September 2026",
      intro: "Smart City is an independent project built for Chișinău City Hall's Smart City challenge. It is not an official City Hall service. Here we explain briefly what data we keep when you create an account, and why.",
      sections: [
        ["What we keep", [], ["The name and email address you enter when signing up.", "The role you choose (resident or municipal employee) and your preferred answer language.", "Your password, only in irreversibly encrypted form (a scrypt hash). Nobody, including the project team, can read it.", "The date you accepted this policy and its version.", "When you sign in: a session with your IP address and browser type, so we can keep you signed in safely."]],
        ["Why we use it", ["Only to create your account, sign you in and protect the account, for example by limiting repeated password attempts. We don't sell your data, use it for advertising or send you marketing messages."], []],
        ["Questions you ask the assistant", ["The questions you type in the chat and any attached files stay, for now, only in your browser and are not saved on the server."], []],
        ["Where it is stored", ["Account data is kept in a PostgreSQL database hosted by Neon, in an Amazon Web Services data centre in the USA, and the website runs on Vercel, also in the USA. The connection between your browser and the server is encrypted (HTTPS)."], []],
        ["Cookies and browser storage", [], ["One session cookie, needed to sign in. Page scripts cannot read it.", "In browser storage we keep only preferences: the interface language and whether you want to see Victor, the guide.", "We don't use advertising or tracking cookies."]],
        ["How long we keep it", ["As long as you have an account. A session expires after at most 30 days, or when you close the browser if you don't tick “Keep me signed in”."], []],
        ["Your rights", ["Under the law of the Republic of Moldova on personal data protection, you can find out what data we keep about you, correct it and ask for your account to be deleted. You can withdraw your consent at any time; without it, the account can no longer work."], []],
      ],
      consent: "I agree to the processing of my personal data (name, email) under the {link}.",
      consentLink: "Privacy policy",
      signInNote: "By signing in, you confirm you have read the {link}.",
      signInLink: "Privacy policy",
    },
    brand: { name: "Smart City", tag: "Chișinău municipal assistant" },
    hero: {
      eyebrow: "Chișinău · municipal AI assistant",
      title: "Answers from City Hall documents, with the passage to prove it.",
      sub: "Ask about permits, local taxes or public services in Romanian or Russian. Every answer cites the exact document and passage. When the documents are silent or disagree, it tells you so.",
      label: "Your question",
      placeholder: "e.g. What do I need for a building permit?",
      ask: "Ask",
      chips: ["Building permit", "Local taxes", "Parking in the centre", "District office contacts"],
      note: "Answers come only from City Hall's published documents.",
    },
    pillars: [
      ["RO · RU", "Both languages first-class"],
      ["Doc + passage", "Cited on every answer"],
      ["No made-up answers", "Tells you when information is missing or documents conflict"],
      ["Right door", "Routed to the office that can help"],
    ],
    how: {
      eyebrow: "How it works",
      title: "How an answer is made",
      steps: [
        ["You ask", "In Romanian or Russian, in your own words. You don't need to know which decision governs your case."],
        ["We search official documents", "Only the decisions, regulations and procedures published by City Hall. No other sources from the internet."],
        ["You get the passage", "A plain-language answer, plus the document and the exact passage it rests on."],
        ["You reach the right door", "If your case needs an office visit, you get a link to the City Hall contact page that handles it."],
      ],
    },
    honesty: {
      eyebrow: "Honest by design",
      title: "Three kinds of answer. All of them honest.",
      cards: [
        ["Answered", "Cited to the passage", "A clear answer, with the document title and the passage you can open and check yourself."],
        ["Not in the database", "Said plainly", "If the published documents don't cover your question, you're told so and pointed to who can answer it (with a phone number or an address)."],
        ["Documents disagree", "Both sides shown", "When two documents conflict, you see both passages side by side, not a guess. The publication date of each document is shown too."],
      ],
      sheet: {
        title: "What an answer looks like",
        tag: "Sample",
        mark: "The exact passage is highlighted in the document.",
        rows: [
        ["question", "Your question", "“What documents do I need for a building permit?”"],
        ["answer", "The answer", "Short and in plain language, based only on official documents."],
        ["source", "Source", "Document title, article and paragraph, plus the publication date."],
        ["missing", "If information is missing", "We tell you plainly and never make up an answer."],
        ["next", "Next step", "The responsible City Hall office, with phone number and address."],
        ],
      },
    },
    bilingual: {
      eyebrow: "Română · Русский",
      title: "Two languages. One truth.",
      sub: "Ask in Romanian or Russian. The answer comes back in your language, and the citation points to the same passage either way.",
      same: "Same document, same passage",
    },
    audience: {
      eyebrow: "Who it's for",
      title: "For residents and City Hall staff",
      items: [
        ["Residents", "Understand your rights, obligations and procedures without reading hundreds of pages of decisions."],
        ["Municipal employees", "Find the governing passage in seconds and give every resident the same, consistent answer."],
      ],
    },
    cta: {
      title: "Ask your first question",
      sub: "Create a free account to ask, save answers and rate how useful they were.",
    },
    footer: {
      sources: "Public sources",
      links: [
        ["Transparency · chisinau.md", "https://www.chisinau.md/ro/transparenta"],
        ["City projects", "https://proiecte.chisinau.md"],
        ["Suburbs", "https://suburbii.chisinau.md"],
      ],
      disclaimer: "An independent project built for the Smart City challenge. Not an official service of Chișinău City Hall.",
      product: "Product",
    },
    auth: {
      panelQuote: "Every answer, traceable to the page it came from.",
      panelCaption: "Decisions, regulations and procedures of Chișinău City Hall, searchable in Romanian and Russian.",
      back: "Back to home",
      email: "Email",
      password: "Password",
      show: "Show",
      hide: "Hide",
      showPassword: "Show password",
      hidePassword: "Hide password",
      coach: {
        name: "Victor explains",
        close: "Close explanation",
        codes: {
          nameRequired: ["Type your full name.", "First and last name, for example “Ion Popescu”."],
          nameShort: ["The name looks too short.", "Type at least 2 letters: first and last name."],
          emailRequired: ["Type your email address.", "It looks like this: name@gmail.com"],
          emailSpaces: ["An email address can't contain spaces.", "Remove the spaces: “ion popescu@…” becomes “ionpopescu@…”."],
          emailNoAt: ["The address is missing the “@” sign.", "An address looks like name@gmail.com. On most keyboards “@” is Shift + 2."],
          emailTwoAt: ["The address has the “@” sign twice.", "“@” appears only once, between the name and the domain."],
          emailNoName: ["The part before “@” is missing.", "The mailbox name comes before “@”, for example “ion.popescu@gmail.com”."],
          emailNoDomain: ["The domain after “@” is missing.", "For example: @gmail.com, @mail.ru or @yahoo.com."],
          emailNoDot: ["The domain looks incomplete.", "Check the part after “@”: it should look like “gmail.com”, not just “gmail”."],
          emailInvalid: ["The email address doesn't look right.", "Check it letter by letter, for example name@gmail.com."],
          passwordRequired: ["Choose a password.", "At least 8 characters, with letters and numbers."],
          passwordMissing: ["Type your password.", "The password you chose when you created the account."],
          passwordShort: ["The password has {n} of the 8 characters needed.", "Add a few more. Tip: three easy-to-remember words, like “cherry-sun-2026”."],
          passwordLong: ["The password is too long.", "Use at most 128 characters."],
          terms: ["Tick the confirmation box.", "It confirms you understand that answers come only from City Hall's published documents."],
          privacy: ["Tick the personal data agreement.", "We need your consent to keep your name and email for the account. Details are in the Privacy policy."],
          capsLock: ["Caps Lock is on.", "Passwords are case-sensitive. Press Caps Lock to turn it off."],
          userExists: ["An account with this address already exists.", "Try signing in, or use a different email address."],
          badCredentials: ["The email or password doesn't match.", "Check that the address is spelled right and that Caps Lock is off."],
          rateLimited: ["Too many attempts in a short time.", "Wait {n} seconds, then try again."],
          network: ["We couldn't reach the server.", "Check your internet connection and try again."],
          server: ["Something went wrong on our side.", "It's not your fault. Please try again in a few moments."],
          forgotSoon: ["Password recovery is coming soon.", "Meanwhile, check that Caps Lock is off and try again."],
        },
      },
      signIn: {
        title: "Welcome back",
        sub: "Sign in to keep asking City Hall's documents.",
        remember: "Keep me signed in",
        forgot: "Forgot password?",
        submit: "Sign in",
        submitting: "Signing in…",
        alt: "New here?",
        altLink: "Create an account",
        pending: "Your question will be waiting after you sign in:",
      },
      signUp: {
        title: "Create your account",
        sub: "Free for every resident and municipal employee.",
        name: "Full name",
        hint: "At least 8 characters.",
        role: "I am a",
        citizen: "Resident",
        employee: "Municipal employee",
        lang: "Preferred answer language",
        terms: "I understand that answers come only from published City Hall documents and are not legal advice.",
        submit: "Create account",
        submitting: "Creating account…",
        alt: "Already have an account?",
        altLink: "Sign in",
      },
    },
    chat: {
      title: "Ask City Hall's documents",
      sidebar: {
        newChat: "New conversation",
        filter: "Filter conversations",
        filterEmpty: "No conversation matches.",
        history: "Conversation history",
        today: "Today",
        week: "This week",
        older: "Earlier",
        collapse: "Collapse sidebar",
        expand: "Expand sidebar",
        resize: "Resize sidebar",
        backHome: "Back to home",
        legend: {
          title: "What the colours mean",
          items: [
            "Answer with a source: the document and the exact passage.",
            "The information isn't in the published documents.",
            "The documents contradict each other: you see both passages.",
          ],
        },
      },
      empty: {
        title: "What would you like to ask City Hall's documents?",
        sub: "Write your question in your own words. The answer comes back with the document and the passage it rests on — and with a plain note when the documents do not cover your case.",
        statesLabel: "What an answer can look like",
        suggestionsLabel: "Try one of these",
        suggestions: [
          "Cine e medicul meu de familie dacă locuiesc pe str. Kiev 12?",
          "What do I need for a building permit?",
          "Who sets the parking tariff in the centre?",
        ],
      },
      composer: {
        placeholder: "Ask about permits, taxes or public services…",
        send: "Send",
        attach: "Attach files",
        attachHint: "Files stay in your browser — nothing is uploaded.",
        dropHere: "Drop the files to attach them",
        remove: "Remove attachment",
        thinking: "Searching the official documents…",
        attachments: "Attachments",
      },
      answer: {
        you: "You",
        assistant: "Municipal assistant",
        sources: "Sources",
        citation: "Reference",
        nextSteps: "Continue here",
        stubTitle: "Kept as history only",
        stubText:
          "This conversation sits in the demo history to show how the list behaves. Its messages were not saved.",
        offlineTitle: "Not connected to a server yet",
        offlineText:
          "The assistant isn't connected to the document database yet, so it couldn't search for an answer. The family-doctor question in the history already works end to end.",
      },
      reader: {
        label: "Cited document",
        close: "Close document",
        openSource: "Open the source",
        prev: "Previous reference",
        next: "Next reference",
        retrieved: "Retrieved",
        fidelity: {
          full: "Full text retrieved from the source.",
          partial:
            "Only the quoted passage was retrieved from the source. Open the source for the full document.",
          record:
            "Structured record compiled from the public source, not the source's own wording. Open the source for the original.",
        },
        kinds: { guide: "Guide", law: "Law", registry: "Public record" },
      },
    },
  },

  ro: {
    nav: {
      home: "Acasă",
      about: "Despre noi",
      faq: "Întrebări",
      signIn: "Autentificare",
      signUp: "Înregistrare",
      greeting: "Bună, {name}",
      signOut: "Ieșire",
      menu: "Meniu",
      close: "Închide meniul",
      skip: "Salt la conținut",
      language: "Limba",
    },
    guide: {
      name: "Victor · Ghidul dvs.",
      next: "Mai departe",
      done: "Am înțeles",
      close: "Închide",
      step: "Pasul {n} din {total}",
      back: "Înapoi",
      off: "Sunt utilizator experimentat. Nu mai afișa ghidul.",
      launcher: "Ghid",
      launch: "Pornește ghidul cu Victor",
      tours: {
        home: [
          "Bună ziua! Sunt Victor, specialist al Primăriei. Vă ajut să găsiți răspunsuri în documentele oficiale ale orașului.",
          "Scrieți aici tot ce doriți să aflați, de exemplu despre acte, taxe sau autorizații. Apoi apăsați „Întreabă”.",
        ],
        signIn: [
          "Bună ziua! Vă ajut să intrați în cont în câțiva pași.",
          "Scrieți adresa de e-mail și parola cu care v-ați înregistrat. Apăsați „Arată” ca să vedeți parola scrisă. Dacă ați uitat-o, apăsați „Ați uitat parola?”.",
          "Bifați „Ține-mă minte” dacă folosiți dispozitivul dvs. personal, apoi apăsați „Autentificare”.",
          "Nu aveți încă un cont? Apăsați „Creați un cont”.",
        ],
        chat: [
          "Bună ziua! Aici puneți întrebări despre documentele Primăriei. Vă arăt pe scurt cum funcționează.",
          "În istoricul conversațiilor (pe telefon, butonul ☰ din stânga sus) găsiți întrebările anterioare. Deschideți-o pe cea despre medicul de familie ca să vedeți un răspuns complet, cu surse.",
          "În răspunsuri, numerele mici, de exemplu [1], sunt sursele. Apăsați pe ele și se deschide documentul, cu pasajul exact evidențiat.",
          "Scrieți aici întrebarea, cu cuvintele dvs., apoi apăsați „Trimite” sau tasta Enter.",
        ],
        signUp: [
          "Bună ziua! Crearea contului durează cam un minut. Vă arăt fiecare pas.",
          "Mai întâi, alegeți cine sunteți: locuitor sau angajat al Primăriei.",
          "Apoi scrieți numele complet, adresa de e-mail și o parolă de cel puțin 8 caractere. Bara colorată arată cât de sigură este parola.",
          "Alegeți limba în care doriți să primiți răspunsurile: română sau rusă.",
          "La final, bifați cele două confirmări și apăsați „Creează contul”. Gata!",
        ],
      },
    },
    sponsor: { label: "Provocare lansată de", name: "Primăria Municipiului Chișinău" },
    privacy: {
      title: "Politica de confidențialitate",
      updated: "Actualizată la 26 septembrie 2026",
      intro: "Smart City este un proiect independent, realizat pentru provocarea Smart City a Primăriei municipiului Chișinău. Nu este un serviciu oficial al Primăriei. Aici explicăm, pe scurt, ce date păstrăm când vă creați un cont și de ce.",
      sections: [
        ["Ce date păstrăm", [], ["Numele și adresa de e-mail pe care le introduceți la înregistrare.", "Rolul ales (locuitor sau angajat municipal) și limba preferată a răspunsurilor.", "Parola, doar în formă criptată ireversibil (hash scrypt). Nimeni, nici echipa proiectului, nu o poate citi.", "Data la care ați acceptat această politică și versiunea ei.", "La autentificare: o sesiune cu adresa IP și tipul de browser, ca să vă putem ține conectat în siguranță."]],
        ["De ce le folosim", ["Doar pentru a vă crea contul, a vă autentifica și a vă proteja contul, de exemplu limitând încercările repetate de parolă. Nu vindem datele, nu le folosim pentru publicitate și nu vă trimitem mesaje de marketing."], []],
        ["Întrebările adresate asistentului", ["Întrebările pe care le scrieți în chat și fișierele atașate rămân, deocamdată, doar în browserul dvs. și nu sunt salvate pe server."], []],
        ["Unde sunt stocate", ["Datele contului sunt păstrate într-o bază de date PostgreSQL găzduită de Neon, într-un centru de date Amazon Web Services din SUA, iar site-ul rulează pe Vercel, tot în SUA. Legătura dintre browser și server este criptată (HTTPS)."], []],
        ["Cookie-uri și memoria browserului", [], ["Un singur cookie de sesiune, necesar pentru autentificare. Scripturile paginii nu îl pot citi.", "În memoria browserului păstrăm doar preferințe: limba interfeței și dacă doriți să-l vedeți pe Victor, ghidul.", "Nu folosim cookie-uri de publicitate sau de urmărire."]],
        ["Cât timp le păstrăm", ["Cât timp aveți cont. Sesiunea expiră după cel mult 30 de zile, iar dacă nu bifați „Ține-mă minte”, la închiderea browserului."], []],
        ["Drepturile dvs.", ["Conform legislației Republicii Moldova privind protecția datelor cu caracter personal, aveți dreptul să aflați ce date păstrăm despre dvs., să le corectați și să cereți ștergerea contului. Vă puteți retrage oricând acordul; fără el, contul nu mai poate funcționa."], []],
      ],
      consent: "Sunt de acord cu prelucrarea datelor mele personale (nume, e-mail) conform {link}.",
      consentLink: "Politicii de confidențialitate",
      signInNote: "Prin autentificare, confirmați că ați citit {link}.",
      signInLink: "Politica de confidențialitate",
    },
    brand: { name: "Smart City", tag: "Asistentul municipal Chișinău" },
    hero: {
      eyebrow: "Chișinău · asistent AI municipal",
      title: "Răspunsuri din documentele Primăriei, cu pasajul care o dovedește.",
      sub: "Întrebați despre autorizații, taxe locale sau servicii publice în română sau rusă. Fiecare răspuns citează documentul și pasajul exact. Când documentele tac sau se contrazic, vă spune direct.",
      label: "Întrebarea dvs.",
      placeholder: "ex. Ce acte îmi trebuie pentru autorizația de construire?",
      ask: "Întreabă",
      chips: ["Autorizație de construire", "Taxe locale", "Parcare în centru", "Contactele preturilor"],
      note: "Răspunsurile provin doar din documentele publice ale Primăriei.",
    },
    pillars: [
      ["RO · RU", "Ambele limbi, la egalitate"],
      ["Document + pasaj", "Citat la fiecare răspuns"],
      ["Fără răspunsuri inventate", "Vă spune când lipsesc informații sau documentele se contrazic"],
      ["Ușa potrivită", "Vă îndrumă spre subdiviziunea competentă a Primăriei"],
    ],
    how: {
      eyebrow: "Cum funcționează",
      title: "Cum se formează un răspuns",
      steps: [
        ["Întrebați", "În română sau rusă, cu cuvintele dvs. Nu trebuie să știți ce decizie se aplică în cazul dvs."],
        ["Căutăm în documentele oficiale", "Doar în deciziile, regulamentele și procedurile publicate de Primărie. Nu folosim alte surse de pe internet."],
        ["Primiți pasajul", "Un răspuns pe înțeles, cu documentul și pasajul exact pe care se bazează."],
        ["Ajungeți la ușa potrivită", "Dacă trebuie să mergeți personal la Primărie, primiți linkul spre pagina de contact a subdiviziunii care se ocupă de caz."],
      ],
    },
    honesty: {
      eyebrow: "Onest prin design",
      title: "Trei tipuri de răspuns. Toate oneste.",
      cards: [
        ["Răspuns găsit", "Citat până la pasaj", "Un răspuns clar, cu titlul documentului și pasajul pe care îl puteți deschide și verifica."],
        ["Nu există în baza de date", "Spus direct", "Dacă documentele publicate nu acoperă întrebarea, vi se spune și sunteți îndrumat spre cine poate răspunde (cu un număr de telefon sau o adresă)."],
        ["Documente contradictorii", "Ambele părți", "Când două documente se contrazic, vedeți ambele pasaje alăturat, nu o presupunere. Se indică și data publicării fiecărui document."],
      ],
      sheet: {
        title: "Cum arată un răspuns",
        tag: "Model",
        mark: "Pasajul exact este evidențiat în document.",
        rows: [
        ["question", "Întrebarea dvs.", "„Ce acte îmi trebuie pentru autorizația de construire?”"],
        ["answer", "Răspunsul", "Explicat pe scurt și pe înțeles, doar pe baza documentelor oficiale."],
        ["source", "Sursa", "Denumirea documentului, articolul și alineatul, plus data publicării."],
        ["missing", "Dacă lipsesc informații", "Vă spunem direct și nu inventăm un răspuns."],
        ["next", "Pasul următor", "Subdiviziunea responsabilă a Primăriei, cu telefon și adresă."],
        ],
      },
    },
    bilingual: {
      eyebrow: "Română · Русский",
      title: "Două limbi. Un singur adevăr.",
      sub: "Întrebați în română sau rusă. Răspunsul vine în limba dvs., iar citarea indică același pasaj în ambele cazuri.",
      same: "Același document, același pasaj",
    },
    audience: {
      eyebrow: "Pentru cine",
      title: "Pentru cetățeni și pentru angajații Primăriei",
      items: [
        ["Locuitori", "Înțelegeți-vă drepturile, obligațiile și procedurile fără să citiți sute de pagini de decizii."],
        ["Angajați municipali", "Găsiți pasajul relevant în câteva secunde și oferiți fiecărui locuitor același răspuns, consecvent."],
      ],
    },
    cta: {
      title: "Puneți prima întrebare",
      sub: "Creați un cont gratuit ca să întrebați, să salvați răspunsuri și să evaluați cât de utile au fost.",
    },
    footer: {
      sources: "Surse publice",
      links: [
        ["Transparență · chisinau.md", "https://www.chisinau.md/ro/transparenta"],
        ["Proiectele orașului", "https://proiecte.chisinau.md"],
        ["Suburbii", "https://suburbii.chisinau.md"],
      ],
      disclaimer: "Proiect independent realizat pentru provocarea Smart City. Nu este un serviciu oficial al Primăriei municipiului Chișinău.",
      product: "Produs",
    },
    auth: {
      panelQuote: "Fiecare răspuns, urmărit până la pagina din care provine.",
      panelCaption: "Deciziile, regulamentele și procedurile Primăriei Chișinău, căutabile în română și rusă.",
      back: "Înapoi acasă",
      email: "E-mail",
      password: "Parolă",
      show: "Arată",
      hide: "Ascunde",
      showPassword: "Arată parola",
      hidePassword: "Ascunde parola",
      coach: {
        name: "Victor explică",
        close: "Închide explicația",
        codes: {
          nameRequired: ["Scrieți numele complet.", "Numele și prenumele, de exemplu „Ion Popescu”."],
          nameShort: ["Numele pare prea scurt.", "Scrieți cel puțin 2 litere: numele și prenumele."],
          emailRequired: ["Scrieți adresa de e-mail.", "Arată cam așa: nume@gmail.com"],
          emailSpaces: ["Adresa de e-mail nu poate avea spații.", "Ștergeți spațiile: „ion popescu@…” devine „ionpopescu@…”."],
          emailNoAt: ["Adresei îi lipsește semnul „@”.", "O adresă arată așa: nume@gmail.com. Pe tastatură, „@” se scrie de obicei cu Shift + 2."],
          emailTwoAt: ["Adresa are de două ori semnul „@”.", "Semnul „@” apare o singură dată, între nume și domeniu."],
          emailNoName: ["Lipsește partea dinaintea semnului „@”.", "Înainte de „@” vine numele contului, de exemplu „ion.popescu@gmail.com”."],
          emailNoDomain: ["După „@” lipsește domeniul.", "De exemplu: @gmail.com, @mail.ru sau @yahoo.com."],
          emailNoDot: ["Domeniul adresei pare incomplet.", "Verificați partea de după „@”: trebuie să fie ca „gmail.com”, nu doar „gmail”."],
          emailInvalid: ["Adresa de e-mail nu pare corectă.", "Verificați-o literă cu literă, de exemplu nume@gmail.com."],
          passwordRequired: ["Alegeți o parolă.", "Cel puțin 8 caractere, cu litere și cifre."],
          passwordMissing: ["Scrieți parola.", "Parola pe care ați ales-o când v-ați creat contul."],
          passwordShort: ["Parola are doar {n} din cele 8 caractere necesare.", "Mai adăugați câteva. Un sfat: trei cuvinte ușor de ținut minte, de exemplu „cires-soare-2026”."],
          passwordLong: ["Parola este prea lungă.", "Folosiți cel mult 128 de caractere."],
          terms: ["Bifați căsuța de confirmare.", "Așa confirmați că ați înțeles: răspunsurile vin doar din documentele publicate ale Primăriei."],
          privacy: ["Bifați acordul privind datele personale.", "Avem nevoie de acordul dvs. ca să păstrăm numele și e-mailul pentru cont. Detaliile sunt în Politica de confidențialitate."],
          capsLock: ["Caps Lock este pornit.", "Parola ține cont de literele mari și mici. Apăsați tasta Caps Lock ca să o opriți."],
          userExists: ["Există deja un cont cu această adresă.", "Încercați să vă autentificați sau folosiți o altă adresă de e-mail."],
          badCredentials: ["E-mailul sau parola nu se potrivesc.", "Verificați dacă adresa e scrisă corect și dacă nu e pornit Caps Lock."],
          rateLimited: ["Prea multe încercări într-un timp scurt.", "Așteptați {n} secunde, apoi încercați din nou."],
          network: ["Nu ne-am putut conecta la server.", "Verificați conexiunea la internet și încercați din nou."],
          server: ["Ceva nu a funcționat la noi.", "Nu e vina dvs. Încercați din nou peste câteva momente."],
          forgotSoon: ["Recuperarea parolei va fi disponibilă în curând.", "Până atunci, verificați dacă nu e pornit Caps Lock și încercați din nou."],
        },
      },
      signIn: {
        title: "Bine ați revenit",
        sub: "Autentificați-vă pentru a continua să întrebați documentele Primăriei.",
        remember: "Ține-mă minte",
        forgot: "Ați uitat parola?",
        submit: "Autentificare",
        submitting: "Se verifică…",
        alt: "Sunteți nou?",
        altLink: "Creați un cont",
        pending: "Întrebarea vă așteaptă după autentificare:",
      },
      signUp: {
        title: "Creați-vă contul",
        sub: "Gratuit pentru fiecare locuitor și angajat municipal.",
        name: "Nume complet",
        hint: "Cel puțin 8 caractere.",
        role: "Sunt",
        citizen: "Locuitor",
        employee: "Angajat municipal",
        lang: "Limba preferată a răspunsurilor",
        terms: "Înțeleg că răspunsurile provin doar din documentele publicate ale Primăriei și nu constituie consultanță juridică.",
        submit: "Creează contul",
        submitting: "Se creează contul…",
        alt: "Aveți deja un cont?",
        altLink: "Autentificare",
      },
    },
    chat: {
      title: "Întrebați documentele Primăriei",
      sidebar: {
        newChat: "Conversație nouă",
        filter: "Filtrează conversațiile",
        filterEmpty: "Nicio conversație nu corespunde.",
        history: "Istoricul conversațiilor",
        today: "Astăzi",
        week: "Săptămâna aceasta",
        older: "Mai vechi",
        collapse: "Ascunde bara laterală",
        expand: "Arată bara laterală",
        resize: "Redimensionează bara laterală",
        backHome: "Înapoi acasă",
        legend: {
          title: "Ce înseamnă culorile",
          items: [
            "Răspuns cu sursă: documentul și pasajul exact.",
            "Informația nu există în documentele publicate.",
            "Documentele se contrazic: vedeți ambele pasaje.",
          ],
        },
      },
      empty: {
        title: "Ce doriți să întrebați documentele Primăriei?",
        sub: "Scrieți întrebarea cu cuvintele dvs. Răspunsul vine cu documentul și pasajul pe care se bazează — iar când documentele nu acoperă cazul dvs., vi se spune direct.",
        statesLabel: "Cum poate arăta un răspuns",
        suggestionsLabel: "Încercați una dintre acestea",
        suggestions: [
          "Cine e medicul meu de familie dacă locuiesc pe str. Kiev 12?",
          "Ce acte îmi trebuie pentru autorizația de construire?",
          "Cine stabilește tariful de parcare în centru?",
        ],
      },
      composer: {
        placeholder: "Întrebați despre autorizații, taxe sau servicii publice…",
        send: "Trimite",
        attach: "Atașează fișiere",
        attachHint: "Fișierele rămân în browserul dvs. — nimic nu este încărcat.",
        dropHere: "Eliberați fișierele pentru a le atașa",
        remove: "Elimină atașamentul",
        thinking: "Căutăm în documentele oficiale…",
        attachments: "Atașamente",
      },
      answer: {
        you: "Dvs.",
        assistant: "Asistentul municipal",
        sources: "Surse",
        citation: "Referința",
        nextSteps: "Continuați aici",
        stubTitle: "Păstrată doar în istoric",
        stubText:
          "Această conversație apare în istoricul demonstrativ pentru a arăta cum se comportă lista. Mesajele ei nu au fost salvate.",
        offlineTitle: "Încă neconectat la un server",
        offlineText:
          "Asistentul nu este încă conectat la baza de documente, așa că nu a putut căuta un răspuns. Întrebarea despre medicul de familie din istoric funcționează deja complet.",
      },
      reader: {
        label: "Documentul citat",
        close: "Închide documentul",
        openSource: "Deschide sursa",
        prev: "Referința precedentă",
        next: "Referința următoare",
        retrieved: "Preluat",
        fidelity: {
          full: "Text integral preluat din sursă.",
          partial:
            "Doar pasajul citat a fost preluat din sursă. Deschideți sursa pentru documentul integral.",
          record:
            "Fișă structurată, alcătuită din sursa publică — nu formularea proprie a documentului. Deschideți sursa pentru original.",
        },
        kinds: { guide: "Ghid", law: "Lege", registry: "Registru public" },
      },
    },
  },

  ru: {
    nav: {
      home: "Главная",
      about: "О нас",
      faq: "Вопросы",
      signIn: "Вход",
      signUp: "Регистрация",
      greeting: "Здравствуйте, {name}",
      signOut: "Выйти",
      menu: "Меню",
      close: "Закрыть меню",
      skip: "Перейти к содержанию",
      language: "Язык",
    },
    guide: {
      name: "Виктор · Ваш помощник",
      next: "Далее",
      done: "Понятно",
      close: "Закрыть",
      step: "Шаг {n} из {total}",
      back: "Назад",
      off: "Я опытный пользователь. Больше не показывать помощника.",
      launcher: "Помощник",
      launch: "Запустить помощника Виктора",
      tours: {
        home: [
          "Здравствуйте! Я Виктор, специалист Примэрии. Помогу найти ответы в официальных документах города.",
          "Напишите здесь всё, что хотите узнать, например о документах, налогах или разрешениях. Затем нажмите «Спросить».",
        ],
        signIn: [
          "Здравствуйте! Помогу войти в аккаунт за несколько шагов.",
          "Введите эл. почту и пароль, указанные при регистрации. Нажмите «Показать», чтобы увидеть введённый пароль. Если забыли его, нажмите «Забыли пароль?».",
          "Отметьте «Запомнить меня», если это ваше личное устройство, и нажмите «Войти».",
          "Ещё нет аккаунта? Нажмите «Создать аккаунт».",
        ],
        chat: [
          "Здравствуйте! Здесь можно задавать вопросы по документам Примэрии. Коротко покажу, как это работает.",
          "В истории разговоров (на телефоне — кнопка ☰ слева вверху) хранятся прежние вопросы. Откройте разговор о семейном враче, чтобы увидеть полный ответ с источниками.",
          "В ответах маленькие цифры, например [1], — это источники. Нажмите на цифру, и откроется документ с выделенным точным фрагментом.",
          "Напишите здесь вопрос своими словами и нажмите «Отправить» или клавишу Enter.",
        ],
        signUp: [
          "Здравствуйте! Создание аккаунта займёт около минуты. Я покажу каждый шаг.",
          "Сначала выберите, кто вы: житель или сотрудник Примэрии.",
          "Затем укажите полное имя, эл. почту и пароль не короче 8 символов. Цветная полоска показывает, насколько надёжен пароль.",
          "Выберите язык, на котором хотите получать ответы: румынский или русский.",
          "В конце отметьте оба подтверждения и нажмите «Создать аккаунт». Готово!",
        ],
      },
    },
    sponsor: { label: "Задача предложена", name: "Примэрия муниципия Кишинэу" },
    privacy: {
      title: "Политика конфиденциальности",
      updated: "Обновлено 26 сентября 2026 года",
      intro: "Smart City — независимый проект, созданный для конкурса Smart City Примэрии муниципия Кишинэу. Это не официальный сервис Примэрии. Здесь коротко объясняем, какие данные мы храним, когда вы создаёте аккаунт, и зачем.",
      sections: [
        ["Какие данные мы храним", [], ["Имя и адрес эл. почты, которые вы указываете при регистрации.", "Выбранную роль (житель или муниципальный служащий) и предпочитаемый язык ответов.", "Пароль — только в необратимо зашифрованном виде (хеш scrypt). Его не может прочитать никто, включая команду проекта.", "Дату, когда вы приняли эту политику, и её версию.", "При входе: сессию с IP-адресом и типом браузера, чтобы безопасно сохранять вход."]],
        ["Зачем мы их используем", ["Только чтобы создать аккаунт, выполнить вход и защитить аккаунт, например ограничивая повторные попытки ввода пароля. Мы не продаём данные, не используем их для рекламы и не отправляем рекламные сообщения."], []],
        ["Вопросы помощнику", ["Вопросы, которые вы пишете в чате, и прикреплённые файлы пока остаются только в вашем браузере и не сохраняются на сервере."], []],
        ["Где хранятся данные", ["Данные аккаунта хранятся в базе данных PostgreSQL у Neon, в центре обработки данных Amazon Web Services в США, а сайт работает на Vercel, также в США. Соединение между браузером и сервером зашифровано (HTTPS)."], []],
        ["Cookie и память браузера", [], ["Один cookie сессии, необходимый для входа. Скрипты страницы не могут его прочитать.", "В памяти браузера хранятся только настройки: язык интерфейса и то, показывать ли помощника Виктора.", "Мы не используем рекламные и отслеживающие cookie."]],
        ["Как долго мы их храним", ["Пока у вас есть аккаунт. Сессия истекает не позднее чем через 30 дней, а если не отметить «Запомнить меня» — при закрытии браузера."], []],
        ["Ваши права", ["Согласно законодательству Республики Молдова о защите персональных данных, вы можете узнать, какие данные мы о вас храним, исправить их и потребовать удалить аккаунт. Вы можете в любой момент отозвать согласие; без него аккаунт не сможет работать."], []],
      ],
      consent: "Я соглашаюсь на обработку моих персональных данных (имя, эл. почта) в соответствии с {link}.",
      consentLink: "Политикой конфиденциальности",
      signInNote: "Входя, вы подтверждаете, что ознакомились с {link}.",
      signInLink: "Политикой конфиденциальности",
    },
    brand: { name: "Smart City", tag: "Муниципальный помощник Кишинёва" },
    hero: {
      eyebrow: "Кишинёв · муниципальный ИИ-помощник",
      title: "Ответы из документов Примэрии и фрагмент, который это подтверждает.",
      sub: "Спрашивайте о разрешениях, местных налогах и городских услугах на румынском или русском. Каждый ответ ссылается на конкретный документ и фрагмент. Если в документах нет ответа или они противоречат друг другу, помощник прямо об этом скажет.",
      label: "Ваш вопрос",
      placeholder: "напр. Какие документы нужны для разрешения на строительство?",
      ask: "Спросить",
      chips: ["Разрешение на строительство", "Местные налоги", "Парковка в центре", "Контакты претур"],
      note: "Ответы берутся только из опубликованных документов Примэрии.",
    },
    pillars: [
      ["RO · RU", "Оба языка на равных"],
      ["Документ + фрагмент", "Ссылка в каждом ответе"],
      ["Без выдуманных ответов", "Скажет, если данных нет или документы противоречат друг другу"],
      ["Нужная дверь", "Переход в профильный отдел"],
    ],
    how: {
      eyebrow: "Как это работает",
      title: "Как формируется ответ",
      steps: [
        ["Вы спрашиваете", "На румынском или русском, своими словами. Не нужно знать, какое решение касается вашего случая."],
        ["Мы ищем в официальных документах", "Только в решениях, положениях и процедурах, опубликованных Примэрией. Другие источники из интернета не используются."],
        ["Вы получаете фрагмент", "Понятный ответ с указанием документа и точного фрагмента, на котором он основан."],
        ["Вы попадаете к нужной двери", "Если нужен личный визит, вы получите ссылку на контактную страницу Примэрии, которая занимается вашим вопросом."],
      ],
    },
    honesty: {
      eyebrow: "Честность по умолчанию",
      title: "Три вида ответа. Все честные.",
      cards: [
        ["Ответ найден", "Со ссылкой на фрагмент", "Ясный ответ с названием документа и фрагментом, который можно открыть и проверить."],
        ["Нет в базе данных", "Сказано прямо", "Если опубликованные документы не отвечают на вопрос, вам об этом скажут и подскажут, кто может помочь (с номером телефона или адресом)."],
        ["Документы расходятся", "Обе стороны", "Если два документа противоречат друг другу, вы увидите оба фрагмента рядом, а не догадку. Также указывается дата публикации каждого документа."],
      ],
      sheet: {
        title: "Как выглядит ответ",
        tag: "Образец",
        mark: "Точный фрагмент выделен в документе.",
        rows: [
        ["question", "Ваш вопрос", "«Какие документы нужны для разрешения на строительство?»"],
        ["answer", "Ответ", "Кратко и понятно, только на основе официальных документов."],
        ["source", "Источник", "Название документа, статья и пункт, а также дата публикации."],
        ["missing", "Если данных нет", "Мы прямо об этом скажем и не будем выдумывать ответ."],
        ["next", "Следующий шаг", "Ответственный отдел Примэрии, с телефоном и адресом."],
        ],
      },
    },
    bilingual: {
      eyebrow: "Română · Русский",
      title: "Два языка. Одна истина.",
      sub: "Спрашивайте на румынском или русском. Ответ придёт на вашем языке, а ссылка в обоих случаях укажет на один и тот же фрагмент.",
      same: "Тот же документ, тот же фрагмент",
    },
    audience: {
      eyebrow: "Для кого",
      title: "Для жителей и сотрудников Примэрии",
      items: [
        ["Жители", "Разберитесь в своих правах, обязанностях и процедурах, не читая сотни страниц решений."],
        ["Муниципальные служащие", "Находите нужный фрагмент за секунды и давайте каждому жителю одинаковый, последовательный ответ."],
      ],
    },
    cta: {
      title: "Задайте первый вопрос",
      sub: "Создайте бесплатный аккаунт, чтобы задавать вопросы, сохранять ответы и оценивать их полезность.",
    },
    footer: {
      sources: "Открытые источники",
      links: [
        ["Прозрачность · chisinau.md", "https://www.chisinau.md/ro/transparenta"],
        ["Проекты города", "https://proiecte.chisinau.md"],
        ["Пригороды", "https://suburbii.chisinau.md"],
      ],
      disclaimer: "Независимый проект, созданный для конкурса Smart City. Не является официальным сервисом Примэрии муниципия Кишинэу.",
      product: "Продукт",
    },
    auth: {
      panelQuote: "Каждый ответ можно проследить до страницы, из которой он взят.",
      panelCaption: "Решения, положения и процедуры Примэрии Кишинёва с поиском на румынском и русском.",
      back: "На главную",
      email: "Эл. почта",
      password: "Пароль",
      show: "Показать",
      hide: "Скрыть",
      showPassword: "Показать пароль",
      hidePassword: "Скрыть пароль",
      coach: {
        name: "Виктор объясняет",
        close: "Закрыть подсказку",
        codes: {
          nameRequired: ["Введите полное имя.", "Имя и фамилия, например «Иван Попеску»."],
          nameShort: ["Имя слишком короткое.", "Введите хотя бы 2 буквы: имя и фамилию."],
          emailRequired: ["Введите адрес эл. почты.", "Он выглядит примерно так: name@gmail.com"],
          emailSpaces: ["В адресе эл. почты не может быть пробелов.", "Удалите пробелы: «ivan popescu@…» → «ivanpopescu@…»."],
          emailNoAt: ["В адресе не хватает знака «@».", "Адрес выглядит так: name@gmail.com. Знак «@» обычно набирается клавишами Shift + 2 в английской раскладке."],
          emailTwoAt: ["В адресе два знака «@».", "Знак «@» встречается один раз, между именем и доменом."],
          emailNoName: ["Не хватает части перед знаком «@».", "Перед «@» идёт имя ящика, например «ivan.popescu@gmail.com»."],
          emailNoDomain: ["После «@» не хватает домена.", "Например: @gmail.com, @mail.ru или @yahoo.com."],
          emailNoDot: ["Домен адреса выглядит неполным.", "Проверьте часть после «@»: должно быть как «gmail.com», а не просто «gmail»."],
          emailInvalid: ["Адрес эл. почты выглядит неверным.", "Проверьте его по буквам, например name@gmail.com."],
          passwordRequired: ["Придумайте пароль.", "Не короче 8 символов, с буквами и цифрами."],
          passwordMissing: ["Введите пароль.", "Тот пароль, который вы выбрали при регистрации."],
          passwordShort: ["В пароле {n} из 8 нужных символов.", "Добавьте ещё несколько. Совет: три легко запоминающихся слова, например «vishnya-solnce-2026»."],
          passwordLong: ["Пароль слишком длинный.", "Используйте не более 128 символов."],
          terms: ["Отметьте поле подтверждения.", "Так вы подтверждаете, что ответы основаны только на опубликованных документах Примэрии."],
          privacy: ["Отметьте согласие на обработку данных.", "Нам нужно ваше согласие, чтобы хранить имя и эл. почту для аккаунта. Подробности — в Политике конфиденциальности."],
          capsLock: ["Включён Caps Lock.", "Пароль учитывает регистр букв. Нажмите Caps Lock, чтобы выключить его."],
          userExists: ["Аккаунт с этим адресом уже существует.", "Попробуйте войти или используйте другой адрес эл. почты."],
          badCredentials: ["Эл. почта или пароль не совпадают.", "Проверьте, правильно ли написан адрес и не включён ли Caps Lock."],
          rateLimited: ["Слишком много попыток за короткое время.", "Подождите {n} секунд и попробуйте снова."],
          network: ["Не удалось подключиться к серверу.", "Проверьте подключение к интернету и попробуйте снова."],
          server: ["У нас что-то пошло не так.", "Это не ваша ошибка. Попробуйте ещё раз через несколько минут."],
          forgotSoon: ["Восстановление пароля скоро появится.", "А пока проверьте, не включён ли Caps Lock, и попробуйте снова."],
        },
      },
      signIn: {
        title: "С возвращением",
        sub: "Войдите, чтобы продолжить задавать вопросы по документам Примэрии.",
        remember: "Запомнить меня",
        forgot: "Забыли пароль?",
        submit: "Войти",
        submitting: "Проверяем…",
        alt: "Впервые здесь?",
        altLink: "Создать аккаунт",
        pending: "Ваш вопрос будет ждать вас после входа:",
      },
      signUp: {
        title: "Создайте аккаунт",
        sub: "Бесплатно для всех жителей и муниципальных служащих.",
        name: "Полное имя",
        hint: "Минимум 8 символов.",
        role: "Я",
        citizen: "Житель",
        employee: "Муниципальный служащий",
        lang: "Предпочитаемый язык ответов",
        terms: "Я понимаю, что ответы основаны только на опубликованных документах Примэрии и не являются юридической консультацией.",
        submit: "Создать аккаунт",
        submitting: "Создаём аккаунт…",
        alt: "Уже есть аккаунт?",
        altLink: "Войти",
      },
    },
    chat: {
      title: "Спросите документы Примэрии",
      sidebar: {
        newChat: "Новый разговор",
        filter: "Фильтр разговоров",
        filterEmpty: "Совпадений нет.",
        history: "История разговоров",
        today: "Сегодня",
        week: "На этой неделе",
        older: "Ранее",
        collapse: "Скрыть боковую панель",
        expand: "Показать боковую панель",
        resize: "Изменить ширину панели",
        backHome: "На главную",
        legend: {
          title: "Что означают цвета",
          items: [
            "Ответ с источником: документ и точный фрагмент.",
            "Этой информации нет в опубликованных документах.",
            "Документы противоречат друг другу: вы видите оба фрагмента.",
          ],
        },
      },
      empty: {
        title: "Что вы хотите спросить у документов Примэрии?",
        sub: "Напишите вопрос своими словами. Ответ придёт с документом и фрагментом, на котором он основан, — а если документы не охватывают ваш случай, вам скажут об этом прямо.",
        statesLabel: "Как может выглядеть ответ",
        suggestionsLabel: "Попробуйте один из этих",
        suggestions: [
          "Cine e medicul meu de familie dacă locuiesc pe str. Kiev 12?",
          "Какие документы нужны для разрешения на строительство?",
          "Кто устанавливает тариф на парковку в центре?",
        ],
      },
      composer: {
        placeholder: "Спросите о разрешениях, налогах или городских услугах…",
        send: "Отправить",
        attach: "Прикрепить файлы",
        attachHint: "Файлы остаются в вашем браузере — ничего не загружается.",
        dropHere: "Отпустите файлы, чтобы прикрепить",
        remove: "Убрать вложение",
        thinking: "Ищем в официальных документах…",
        attachments: "Вложения",
      },
      answer: {
        you: "Вы",
        assistant: "Муниципальный помощник",
        sources: "Источники",
        citation: "Ссылка",
        nextSteps: "Продолжите здесь",
        stubTitle: "Только в истории",
        stubText:
          "Этот разговор есть в демонстрационной истории, чтобы показать поведение списка. Его сообщения не сохранялись.",
        offlineTitle: "Пока не подключено к серверу",
        offlineText:
          "Помощник пока не подключён к базе документов, поэтому не смог найти ответ. Вопрос о семейном враче из истории уже работает полностью.",
      },
      reader: {
        label: "Цитируемый документ",
        close: "Закрыть документ",
        openSource: "Открыть источник",
        prev: "Предыдущая ссылка",
        next: "Следующая ссылка",
        retrieved: "Получено",
        fidelity: {
          full: "Полный текст получен из источника.",
          partial:
            "Из источника получен только цитируемый фрагмент. Откройте источник, чтобы увидеть документ полностью.",
          record:
            "Структурированная справка, составленная по открытому источнику, а не собственная формулировка документа. Оригинал — по ссылке на источник.",
        },
        kinds: { guide: "Руководство", law: "Закон", registry: "Открытый реестр" },
      },
    },
  },
};

const I18nContext = createContext(null);

// Locale lives in localStorage; the server (and first client render) use "ro".
const listeners = new Set();
let memoryLocale = null;

function readLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LOCALES.includes(saved)) return saved;
  } catch {}
  return memoryLocale ?? "ro";
}

function subscribe(fn) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}

export function I18nProvider({ children }) {
  const locale = useSyncExternalStore(subscribe, readLocale, () => "ro");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    memoryLocale = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    listeners.forEach((fn) => fn());
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
