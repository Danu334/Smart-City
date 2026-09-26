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
        signUp: [
          "Hello! Creating an account takes about a minute. I'll show you each step.",
          "First, choose who you are: a resident or a City Hall employee.",
          "Then write your full name, your email and a password of at least 8 characters. The coloured bar shows how strong the password is.",
          "Choose the language you want your answers in: Romanian or Russian.",
          "Finally, tick the confirmation box and press “Create account”. That's it!",
        ],
      },
    },
    sponsor: { label: "Challenge by", name: "Chișinău City Hall" },
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
        signUp: [
          "Bună ziua! Crearea contului durează cam un minut. Vă arăt fiecare pas.",
          "Mai întâi, alegeți cine sunteți: locuitor sau angajat al Primăriei.",
          "Apoi scrieți numele complet, adresa de e-mail și o parolă de cel puțin 8 caractere. Bara colorată arată cât de sigură este parola.",
          "Alegeți limba în care doriți să primiți răspunsurile: română sau rusă.",
          "La final, bifați confirmarea și apăsați „Creează contul”. Gata!",
        ],
      },
    },
    sponsor: { label: "Provocare lansată de", name: "Primăria Municipiului Chișinău" },
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
        ["Ajungeți la ușa potrivită", "Dacă aveți nevoie de o vizită la ghișeu, primiți linkul spre pagina de contact a Primăriei care se ocupă de caz."],
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
        signUp: [
          "Здравствуйте! Создание аккаунта займёт около минуты. Я покажу каждый шаг.",
          "Сначала выберите, кто вы: житель или сотрудник Примэрии.",
          "Затем укажите полное имя, эл. почту и пароль не короче 8 символов. Цветная полоска показывает, насколько надёжен пароль.",
          "Выберите язык, на котором хотите получать ответы: румынский или русский.",
          "В конце отметьте подтверждение и нажмите «Создать аккаунт». Готово!",
        ],
      },
    },
    sponsor: { label: "Задача предложена", name: "Примэрия муниципия Кишинэу" },
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
