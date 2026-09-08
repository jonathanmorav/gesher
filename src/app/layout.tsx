import type { Metadata } from "next";
import { Heebo, IBM_Plex_Mono } from "next/font/google";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Masthead } from "@/components/Masthead";
import { RadioPlayer } from "@/components/RadioPlayer";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "גשר — חדשות ישראל וגלגלצ",
  description:
    "כותרות מובילות מ-ynet, וואלה, הארץ, Times of Israel, Jerusalem Post, ערוץ 7 ו-i24NEWS, עם שידור חי של גלגלצ.",
  icons: { icon: "/favicon.svg" },
};

const localeBoot = `
try {
  var locale = localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});
  if (locale === "en") {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      suppressHydrationWarning
      className={`${heebo.variable} ${plex.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBoot }} />
      </head>
      <body>
        <LocaleProvider>
          <Masthead />
          {children}
          <RadioPlayer />
        </LocaleProvider>
      </body>
    </html>
  );
}
