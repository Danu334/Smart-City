import Head from "next/head";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import styles from "@/styles/Privacy.module.css";

export default function Privacy() {
  const { t } = useI18n();
  const p = t.privacy;
  return (
    <>
      <Head>
        <title>{`${p.title} · Smart City`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav />
      <main id="main" className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>{p.title}</h1>
          <p className={styles.updated}>{p.updated}</p>
          <p className={styles.intro}>{p.intro}</p>
        </header>
        {p.sections.map(([heading, paragraphs, bullets]) => (
          <section key={heading} className={styles.section}>
            <h2 className={styles.h2}>{heading}</h2>
            {paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
            {bullets.length > 0 && (
              <ul>
                {bullets.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
