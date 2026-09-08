export type SourceId =
  | "ynet"
  | "walla"
  | "haaretz"
  | "toi"
  | "jpost"
  | "inn"
  | "i24"
  | "ice"
  | "wallacelebs"
  | "ynetent";

export type SourceKind = "rss" | "i24";

export type NewsSource = {
  id: SourceId;
  name: string;
  nameEn: string;
  homepage: string;
  feed: string;
  kind: SourceKind;
  lang: "he" | "en";
  color: string;
};

export function sourceName(source: NewsSource, locale: "he" | "en"): string {
  return locale === "en" ? source.nameEn : source.name;
}

export const SOURCES: NewsSource[] = [
  {
    id: "ynet",
    name: "ynet",
    nameEn: "ynet",
    homepage: "https://www.ynet.co.il",
    feed: "https://www.ynet.co.il/Integration/StoryRss2.xml",
    kind: "rss",
    lang: "he",
    color: "#c81d25",
  },
  {
    id: "walla",
    name: "וואלה",
    nameEn: "Walla",
    homepage: "https://news.walla.co.il",
    feed: "https://rss.walla.co.il/feed/1",
    kind: "rss",
    lang: "he",
    color: "#e85d04",
  },
  {
    id: "haaretz",
    name: "הארץ",
    nameEn: "Haaretz",
    homepage: "https://www.haaretz.co.il",
    feed: "https://www.haaretz.co.il/srv/htz-all-articles",
    kind: "rss",
    lang: "he",
    color: "#1d4ed8",
  },
  {
    id: "toi",
    name: "Times of Israel",
    nameEn: "Times of Israel",
    homepage: "https://www.timesofisrael.com",
    feed: "https://www.timesofisrael.com/feed/",
    kind: "rss",
    lang: "en",
    color: "#0f766e",
  },
  {
    id: "jpost",
    name: "Jerusalem Post",
    nameEn: "Jerusalem Post",
    homepage: "https://www.jpost.com",
    feed: "https://www.jpost.com/rss/rssfeedsfrontpage.aspx",
    kind: "rss",
    lang: "en",
    color: "#1e3a5f",
  },
  {
    id: "inn",
    name: "ערוץ 7",
    nameEn: "Arutz 7",
    homepage: "https://www.inn.co.il",
    feed: "https://www.inn.co.il/Rss.aspx",
    kind: "rss",
    lang: "he",
    color: "#365314",
  },
  {
    id: "i24",
    name: "i24NEWS",
    nameEn: "i24NEWS",
    homepage: "https://www.i24news.tv/he",
    feed: "https://api.i24news.tv/v2/he/contents",
    kind: "i24",
    lang: "he",
    color: "#07244b",
  },
  {
    id: "ice",
    name: "אייס",
    nameEn: "Ice",
    homepage: "https://www.ice.co.il",
    feed: "https://www.ice.co.il/rss",
    kind: "rss",
    lang: "he",
    color: "#111111",
  },
  {
    id: "wallacelebs",
    name: "וואלה סלבס",
    nameEn: "Walla Celebs",
    homepage: "https://celebs.walla.co.il",
    feed: "https://rss.walla.co.il/feed/3601",
    kind: "rss",
    lang: "he",
    color: "#db2777",
  },
  {
    id: "ynetent",
    name: "ynet בידור",
    nameEn: "ynet Entertainment",
    homepage: "https://www.ynet.co.il/entertainment",
    feed: "https://www.ynet.co.il/Integration/StoryRss538.xml",
    kind: "rss",
    lang: "he",
    color: "#9d174d",
  },
];

export const SOURCE_BY_ID = Object.fromEntries(
  SOURCES.map((source) => [source.id, source]),
) as Record<SourceId, NewsSource>;

export const HEADLINES_PER_SOURCE = 8;
