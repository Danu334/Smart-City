import { Inter, Onest, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter" });
const onest = Onest({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-onest" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-mono-jb" });

export default function App({ Component, pageProps }) {
  return (
    <I18nProvider>
      <div className={`app ${inter.variable} ${onest.variable} ${mono.variable}`}>
        <div className="tricolor" aria-hidden="true" />
        <Component {...pageProps} />
      </div>
    </I18nProvider>
  );
}
