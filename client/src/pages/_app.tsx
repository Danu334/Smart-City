import type { AppProps } from "next/app";
import { Inter, Onest, JetBrains_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import Loader from "@/components/Loader";
import PawCursor from "@/components/PawCursor";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-inter" });
const onest = Onest({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-onest" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-mono-jb" });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <div className={`app ${inter.variable} ${onest.variable} ${mono.variable}`}>
        <Loader />
        <PawCursor />
        <Component {...pageProps} />
      </div>
    </I18nProvider>
  );
}
