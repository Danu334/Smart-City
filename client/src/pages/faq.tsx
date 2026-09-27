import Head from "next/head";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import styles from "@/styles/InfoPage.module.css";

function Chevron() {
  return (
    <svg className={styles.chevron} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Faq() {
  const { t } = useI18n();
  const f = t.faq;
  return (
    <>
      <Head>
        <title>{`${f.title} · Smart City`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={f.intro} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav />
      <main id="main" className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>{f.title}</h1>
          <p className={styles.intro}>{f.intro}</p>
        </header>

        {f.groups.map(([heading, items], g) => (
          <section key={heading} className={styles.faqGroup} aria-labelledby={`faq-${g}`}>
            <h2 id={`faq-${g}`} className={styles.h2}>
              {heading}
            </h2>
            <div className={styles.faqList}>
              {items.map(([question, answer]) => (
                <details key={question} className={styles.item}>
                  <summary className={styles.q}>
                    {question}
                    <Chevron />
                  </summary>
                  <p className={styles.a}>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <aside className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>{f.more.title}</h2>
            <p className={styles.ctaSub}>{f.more.sub}</p>
          </div>
          <div className={styles.ctaLinks}>
            <Link href="/chat" className={styles.solid}>
              {f.more.button}
            </Link>
          </div>
        </aside>
      </main>
      <Footer />
    </>
  );
}
