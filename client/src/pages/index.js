import { useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Guide from "@/components/guide/Guide";
import { useI18n } from "@/lib/i18n";
import styles from "@/styles/Home.module.css";

const CityScene = dynamic(() => import("@/components/three/CityScene"), { ssr: false });

const STATE_TONES = ["teal", "amber", "rose"];

function StateIcon({ tone }) {
  if (tone === "teal")
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 10.5l3.2 3L15 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (tone === "amber")
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2.4" />
        <path d="M10 7v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="13.2" r="1" fill="currentColor" />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 7h8M4 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 4.5L15.5 7 12 9.5M12 10.5l3.5 2.5-3.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AskBox() {
  const { t } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const question = q.trim();
    if (!question) return input.current?.focus();
    router.push({ pathname: "/sign-in", query: { q: question } });
  };

  return (
    <div className={styles.askWrap}>
      <form id="ask-box" className={styles.ask} onSubmit={submit} role="search">
        <label htmlFor="ask" className="visually-hidden">
          {t.hero.label}
        </label>
        <svg className={styles.askIcon} viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13.2 13.2L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          ref={input}
          id="ask"
          type="text"
          autoComplete="off"
          placeholder={t.hero.placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className={styles.askBtn}>
          {t.hero.ask}
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 10h11M11 5.5L15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      <ul className={styles.chips}>
        {t.hero.chips.map((chip) => (
          <li key={chip}>
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                setQ(chip);
                input.current?.focus();
              }}
            >
              {chip}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Anatomy() {
  const { t } = useI18n();
  const p = t.honesty.parts;
  return (
    <figure className={styles.anatomy} aria-label={t.honesty.anatomy}>
      <figcaption className={styles.anatomyHead}>
        <span>{t.honesty.anatomy}</span>
        <span className={styles.tag}>{t.honesty.illustrative}</span>
      </figcaption>

      <div className={styles.part}>
        <span className={styles.partLabel}>01 · {p.question}</span>
        <div className={styles.bubble}>
          <span className={styles.bar} style={{ width: "72%" }} />
        </div>
      </div>

      <div className={styles.part}>
        <span className={styles.partLabel}>02 · {p.answer}</span>
        <span className={styles.bar} style={{ width: "96%" }} />
        <span className={styles.bar} style={{ width: "88%" }} />
        <span className={styles.bar} style={{ width: "54%" }} />
      </div>

      <div className={styles.part}>
        <span className={styles.partLabel}>03 · {p.source}</span>
        <blockquote className={styles.quote}>
          <span className={styles.bar} style={{ width: "92%" }} />
          <span className={styles.bar} style={{ width: "70%" }} />
        </blockquote>
      </div>

      <div className={styles.partRow}>
        <span className={`${styles.pill} ${styles.amber}`}>
          <StateIcon tone="amber" />
          {p.flag}
        </span>
        <span className={styles.route}>
          {p.route}
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6 14L14 6M8 6h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </figure>
  );
}

export default function Home() {
  const { t } = useI18n();

  return (
    <>
      <Head>
        <title>Smart City · Chișinău</title>
        <meta name="description" content={t.hero.sub} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Nav />

      <main id="main">
        {/* Hero */}
        <section className={styles.heroWrap}>
          <div className={styles.hero}>
            <CityScene className={styles.scene} />
            <div className={styles.scrim} aria-hidden="true" />
            <div className={styles.heroContent}>
              <p className={styles.eyebrowDark}>
                <span className={styles.pulse} aria-hidden="true" />
                {t.hero.eyebrow}
              </p>
              <h1 className={styles.heroTitle}>{t.hero.title}</h1>
              <p className={styles.heroSub}>{t.hero.sub}</p>
              <AskBox />
              <p className={styles.heroNote}>{t.hero.note}</p>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className={styles.pillars} aria-label="Principles">
          {t.pillars.map(([k, v]) => (
            <div key={k} className={styles.pillar}>
              <span className={styles.pillarKey}>{k}</span>
              <span className={styles.pillarVal}>{v}</span>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className={styles.section} aria-labelledby="how">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>{t.how.eyebrow}</p>
            <h2 id="how" className={styles.h2}>{t.how.title}</h2>
          </header>
          <ol className={styles.steps}>
            {t.how.steps.map(([title, body], i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepNum}>0{i + 1}</span>
                <h3 className={styles.h3}>{title}</h3>
                <p className={styles.body}>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Honesty states */}
        <section className={styles.section} aria-labelledby="honesty">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>{t.honesty.eyebrow}</p>
            <h2 id="honesty" className={styles.h2}>{t.honesty.title}</h2>
          </header>
          <div className={styles.honesty}>
            <ul className={styles.states}>
              {t.honesty.cards.map(([name, badge, body], i) => {
                const tone = STATE_TONES[i];
                return (
                  <li key={name} className={styles.state} data-tone={tone}>
                    <span className={`${styles.stateIcon} ${styles[tone]}`}>
                      <StateIcon tone={tone} />
                    </span>
                    <div>
                      <div className={styles.stateHead}>
                        <h3 className={styles.h3}>{name}</h3>
                        <span className={`${styles.pill} ${styles[tone]}`}>{badge}</span>
                      </div>
                      <p className={styles.body}>{body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Anatomy />
          </div>
        </section>

        {/* Bilingual */}
        <section className={styles.section} aria-labelledby="bilingual">
          <div className={styles.bilingual}>
            <div>
              <p className={styles.eyebrow}>{t.bilingual.eyebrow}</p>
              <h2 id="bilingual" className={styles.h2}>{t.bilingual.title}</h2>
              <p className={styles.lead}>{t.bilingual.sub}</p>
            </div>
            <div className={styles.langDiagram}>
              <p className={styles.langQ} lang="ro">
                <span className={styles.langCode}>RO</span>
                Ce acte îmi trebuie pentru autorizația de construire?
              </p>
              <p className={styles.langQ} lang="ru">
                <span className={styles.langCode}>RU</span>
                Какие документы нужны для разрешения на строительство?
              </p>
              <svg className={styles.langLines} viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
                <path d="M40 0 C40 50, 100 40, 100 80" />
                <path d="M160 0 C160 50, 100 40, 100 80" />
              </svg>
              <p className={styles.langSource}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="4.5" y="2.5" width="11" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7.5 7h5M7.5 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {t.bilingual.same}
              </p>
            </div>
          </div>
        </section>

        {/* Audience */}
        <section className={styles.section} aria-labelledby="audience">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>{t.audience.eyebrow}</p>
            <h2 id="audience" className={styles.h2}>{t.audience.title}</h2>
          </header>
          <div className={styles.audience}>
            {t.audience.items.map(([title, body], i) => (
              <article key={title} className={styles.card}>
                <span className={styles.cardIcon} aria-hidden="true">
                  {i === 0 ? (
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24">
                      <path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 20h18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <h3 className={styles.h3}>{title}</h3>
                <p className={styles.body}>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={styles.ctaWrap}>
          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>{t.cta.title}</h2>
            <p className={styles.ctaSub}>{t.cta.sub}</p>
            <div className={styles.ctaActions}>
              <Link href="/sign-up" className={styles.ctaPrimary}>
                {t.nav.signUp}
              </Link>
              <Link href="/sign-in" className={styles.ctaGhost}>
                {t.nav.signIn}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <Guide targetId="ask-box" />
    </>
  );
}
