import Head from "next/head";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import styles from "@/styles/InfoPage.module.css";

// The sites in the Qdrant index, grouped in the order of t.about.sources.groups.
// Keep in step with the index: list a site only once it has been ingested.
const SOURCE_GROUPS: string[][] = [
  [
    "https://suburbii.chisinau.md/",
    "https://ciocana.md/",
    "https://www.botanica.md/",
    "https://rascani.md/",
    "https://preturabuiucani.md/",
    "https://comert.chisinau.md/",
    "https://invest.chisinau.md/",
    "https://visit.chisinau.md/",
  ],
  ["https://dgaurf.md/", "https://dglca.md/", "http://www.infocom.md/", "https://liftservice.md/"],
  ["https://www.acc.md/", "https://autosalubritate.md/", "https://agsv.md/", "https://exdrupo.md/"],
  ["https://rtec.md/", "https://autourban.md/", "https://mobilitatechisinau.md/"],
  [
    "https://dgams.md/",
    "https://help.chisinau.md/",
    "https://amt-centru.md/",
    "https://amt-botanica.md/",
    "https://amt-ciocana.md/",
    "https://amtbuiucani.md/",
    "http://amtriscani.md/",
  ],
  [
    "https://chisinauedu.dgets.md/",
    "https://detscentru.md/",
    "https://detsbotanica.md/",
    "https://detsriscani.md/",
    "https://buiucanidets.md/",
    "https://extrascolar.md/",
    "https://educatieonline.md/",
    "https://e-tineret.md/",
  ],
];

const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export default function About() {
  const { t } = useI18n();
  const a = t.about;
  return (
    <>
      <Head>
        <title>{`${a.title} · Smart City`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={a.intro} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav />
      <main id="main" className={styles.page}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>{a.eyebrow}</p>
          <h1 className={styles.title}>{a.title}</h1>
          <p className={styles.intro}>{a.intro}</p>
        </header>

        {a.sections.map(([heading, paragraphs, bullets]) => (
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

        <section className={styles.section} aria-labelledby="sources">
          <h2 id="sources" className={styles.h2}>
            {a.sources.title}
          </h2>
          <p className={styles.sub}>{a.sources.sub}</p>
          <div className={styles.groups}>
            {SOURCE_GROUPS.map((urls, i) => (
              <div key={a.sources.groups[i]} className={styles.group}>
                <h3 className={styles.groupTitle}>{a.sources.groups[i]}</h3>
                <ul className={styles.hosts}>
                  {urls.map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {host(url)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.cta}>
          <div>
            <h2 className={styles.ctaTitle}>{a.cta.title}</h2>
            <p className={styles.ctaSub}>{a.cta.sub}</p>
          </div>
          <div className={styles.ctaLinks}>
            <Link href="/chat" className={styles.solid}>
              {a.cta.button}
            </Link>
            <Link href="/faq" className={styles.ghost}>
              {a.cta.faq}
            </Link>
          </div>
        </aside>
      </main>
      <Footer />
    </>
  );
}
