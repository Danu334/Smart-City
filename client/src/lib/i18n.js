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
      menu: "Menu",
      close: "Close menu",
      skip: "Skip to content",
      language: "Language",
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
      note: "Answers come only from City Hall's published corpus.",
    },
    pillars: [
      ["RO · RU", "Both languages first-class"],
      ["Doc + passage", "Cited on every answer"],
      ["Gaps flagged", "Missing info and contradictions"],
      ["Right door", "Routed to the office that can help"],
    ],
    how: {
      eyebrow: "How it works",
      title: "How an answer is made",
      steps: [
        ["You ask", "In Romanian or Russian, in your own words. You don't need to know which decision governs your case."],
        ["We search the corpus", "Only City Hall's published decisions, regulations and procedures. Nothing from the open internet."],
        ["You get the passage", "A plain-language answer, plus the document and the exact passage it rests on."],
        ["You reach the right door", "If your case needs an office visit, you get a link to the City Hall contact page that handles it."],
      ],
    },
    honesty: {
      eyebrow: "Honest by design",
      title: "Three kinds of answer. All of them honest.",
      cards: [
        ["Answered", "Cited to the passage", "A clear answer, with the document title and the passage you can open and check yourself."],
        ["Not in the corpus", "Said plainly", "If the published documents don't cover your question, you're told so and pointed to who can answer it."],
        ["Documents disagree", "Both sides shown", "When two documents conflict, you see both passages side by side, not a guess."],
      ],
      anatomy: "Anatomy of an answer",
      illustrative: "Illustrative layout",
      parts: {
        question: "Your question",
        answer: "Plain-language answer",
        source: "Document · article · paragraph",
        flag: "Gap or contradiction flag",
        route: "Contact page for the next step",
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
      title: "Built for both sides of the counter",
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
      notConnected: "Your details look good, but sign-in isn't connected to a server yet, so nothing was sent.",
      errors: {
        required: "This field is required.",
        email: "Enter a valid email address.",
        short: "Use at least 8 characters.",
        terms: "Please confirm to continue.",
      },
      signIn: {
        title: "Welcome back",
        sub: "Sign in to keep asking City Hall's documents.",
        remember: "Keep me signed in",
        forgot: "Forgot password?",
        submit: "Sign in",
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
        alt: "Already have an account?",
        altLink: "Sign in",
      },
    },
    chat: {
      title: "Ask the corpus",
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
      },
      empty: {
        title: "What would you like to ask City Hall's documents?",
        sub: "Write your question in your own words. The answer comes back with the document and the passage it rests on — and with a plain note when the corpus does not cover your case.",
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
        thinking: "Searching the corpus…",
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
          "The interface is complete, but there is no backend behind it, so no search ran over the corpus. The seeded question does work end to end.",
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
      menu: "Meniu",
      close: "Închide meniul",
      skip: "Salt la conținut",
      language: "Limba",
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
      note: "Răspunsurile provin doar din corpusul public al Primăriei.",
    },
    pillars: [
      ["RO · RU", "Ambele limbi, la egalitate"],
      ["Document + pasaj", "Citat la fiecare răspuns"],
      ["Lacune semnalate", "Informații lipsă și contradicții"],
      ["Ușa potrivită", "Direcționare spre biroul competent"],
    ],
    how: {
      eyebrow: "Cum funcționează",
      title: "Cum se formează un răspuns",
      steps: [
        ["Întrebați", "În română sau rusă, cu cuvintele dvs. Nu trebuie să știți ce decizie se aplică în cazul dvs."],
        ["Căutăm în corpus", "Doar deciziile, regulamentele și procedurile publicate de Primărie. Nimic de pe internetul larg."],
        ["Primiți pasajul", "Un răspuns pe înțeles, cu documentul și pasajul exact pe care se bazează."],
        ["Ajungeți la ușa potrivită", "Dacă aveți nevoie de o vizită la ghișeu, primiți linkul spre pagina de contact a Primăriei care se ocupă de caz."],
      ],
    },
    honesty: {
      eyebrow: "Onest prin design",
      title: "Trei tipuri de răspuns. Toate oneste.",
      cards: [
        ["Răspuns găsit", "Citat până la pasaj", "Un răspuns clar, cu titlul documentului și pasajul pe care îl puteți deschide și verifica."],
        ["Nu există în corpus", "Spus direct", "Dacă documentele publicate nu acoperă întrebarea, vi se spune și sunteți îndrumat spre cine poate răspunde."],
        ["Documente contradictorii", "Ambele părți", "Când două documente se contrazic, vedeți ambele pasaje alăturat, nu o presupunere."],
      ],
      anatomy: "Anatomia unui răspuns",
      illustrative: "Schemă ilustrativă",
      parts: {
        question: "Întrebarea dvs.",
        answer: "Răspuns pe înțeles",
        source: "Document · articol · alineat",
        flag: "Semnal de lacună sau contradicție",
        route: "Pagina de contact pentru pasul următor",
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
      title: "Construit pentru ambele părți ale ghișeului",
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
      notConnected: "Datele sunt corecte, dar autentificarea nu este încă conectată la un server, așa că nu s-a trimis nimic.",
      errors: {
        required: "Câmp obligatoriu.",
        email: "Introduceți o adresă de e-mail validă.",
        short: "Folosiți cel puțin 8 caractere.",
        terms: "Confirmați pentru a continua.",
      },
      signIn: {
        title: "Bine ați revenit",
        sub: "Autentificați-vă pentru a continua să întrebați documentele Primăriei.",
        remember: "Ține-mă minte",
        forgot: "Ați uitat parola?",
        submit: "Autentificare",
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
        alt: "Aveți deja un cont?",
        altLink: "Autentificare",
      },
    },
    chat: {
      title: "Întreabă corpusul",
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
      },
      empty: {
        title: "Ce doriți să întrebați documentele Primăriei?",
        sub: "Scrieți întrebarea cu cuvintele dvs. Răspunsul vine cu documentul și pasajul pe care se bazează — iar când corpusul nu acoperă cazul dvs., vi se spune direct.",
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
        thinking: "Căutăm în corpus…",
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
          "Interfața este completă, dar nu există un backend în spate, așa că nu s-a făcut nicio căutare în corpus. Întrebarea din istoric funcționează însă cap-coadă.",
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
      menu: "Меню",
      close: "Закрыть меню",
      skip: "Перейти к содержанию",
      language: "Язык",
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
      note: "Ответы берутся только из открытого корпуса документов Примэрии.",
    },
    pillars: [
      ["RO · RU", "Оба языка на равных"],
      ["Документ + фрагмент", "Ссылка в каждом ответе"],
      ["Пробелы отмечены", "Нехватка данных и противоречия"],
      ["Нужная дверь", "Переход в профильный отдел"],
    ],
    how: {
      eyebrow: "Как это работает",
      title: "Как формируется ответ",
      steps: [
        ["Вы спрашиваете", "На румынском или русском, своими словами. Не нужно знать, какое решение касается вашего случая."],
        ["Мы ищем в корпусе", "Только опубликованные решения, положения и процедуры Примэрии. Ничего из открытого интернета."],
        ["Вы получаете фрагмент", "Понятный ответ с указанием документа и точного фрагмента, на котором он основан."],
        ["Вы попадаете к нужной двери", "Если нужен личный визит, вы получите ссылку на контактную страницу Примэрии, которая занимается вашим вопросом."],
      ],
    },
    honesty: {
      eyebrow: "Честность по умолчанию",
      title: "Три вида ответа. Все честные.",
      cards: [
        ["Ответ найден", "Со ссылкой на фрагмент", "Ясный ответ с названием документа и фрагментом, который можно открыть и проверить."],
        ["Нет в корпусе", "Сказано прямо", "Если опубликованные документы не отвечают на вопрос, вам об этом скажут и подскажут, кто может помочь."],
        ["Документы расходятся", "Обе стороны", "Если два документа противоречат друг другу, вы увидите оба фрагмента рядом, а не догадку."],
      ],
      anatomy: "Анатомия ответа",
      illustrative: "Иллюстративная схема",
      parts: {
        question: "Ваш вопрос",
        answer: "Ответ простым языком",
        source: "Документ · статья · пункт",
        flag: "Отметка о пробеле или противоречии",
        route: "Контактная страница для следующего шага",
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
      title: "Для обеих сторон окошка",
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
      notConnected: "Данные заполнены верно, но вход пока не подключён к серверу, поэтому ничего не отправлено.",
      errors: {
        required: "Обязательное поле.",
        email: "Введите корректный адрес эл. почты.",
        short: "Минимум 8 символов.",
        terms: "Подтвердите, чтобы продолжить.",
      },
      signIn: {
        title: "С возвращением",
        sub: "Войдите, чтобы продолжить задавать вопросы по документам Примэрии.",
        remember: "Запомнить меня",
        forgot: "Забыли пароль?",
        submit: "Войти",
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
        alt: "Уже есть аккаунт?",
        altLink: "Войти",
      },
    },
    chat: {
      title: "Спросите корпус",
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
      },
      empty: {
        title: "Что вы хотите спросить у документов Примэрии?",
        sub: "Напишите вопрос своими словами. Ответ придёт с документом и фрагментом, на котором он основан, — а если корпус не охватывает ваш случай, вам скажут об этом прямо.",
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
        thinking: "Ищем в корпусе…",
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
          "Интерфейс готов, но за ним нет бэкенда, поэтому поиск по корпусу не выполнялся. Вопрос из истории при этом работает полностью.",
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
