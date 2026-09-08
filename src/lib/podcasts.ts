export type PodcastId =
  | "osim"
  | "sipur"
  | "kannews"
  | "hashavua"
  | "callmeback"
  | "unholy"
  | "identity"
  | "israelstory"
  | "toidaily"
  | "tikvah"
  | "heaven"
  | "fleisher";

export type PodcastShow = {
  id: PodcastId;
  name: { he: string; en: string };
  homepage: string;
  feed: string;
  lang: "he" | "en";
};

export const PODCASTS: PodcastShow[] = [
  {
    id: "osim",
    name: { he: "עושים פוליטיקה", en: "Osim Politika" },
    homepage: "https://osimhistoria.com",
    feed: "https://www.spreaker.com/show/4227437/episodes/feed",
    lang: "he",
  },
  {
    id: "sipur",
    name: { he: "סיפור ישראלי", en: "Sipur Yisraeli" },
    homepage: "https://israelstory.org",
    feed: "https://feeds.acast.com/public/shows/694ce3de09314afbecc1ff57",
    lang: "he",
  },
  {
    id: "kannews",
    name: { he: "כאן חדשות", en: "Kan News" },
    homepage: "https://www.kan.org.il",
    feed: "https://www.spreaker.com/show/6095076/episodes/feed",
    lang: "he",
  },
  {
    id: "hashavua",
    name: { he: "השבוע", en: "HaShavua" },
    homepage: "https://www.haaretz.co.il",
    feed: "https://www.omnycontent.com/d/playlist/397b9456-4f75-4509-acff-ac0600b4a6a4/fdef9415-eb17-45d7-85fd-ac08009235b2/4c9f1a8f-8a0e-4f10-b01f-ac08009235b7/podcast.rss",
    lang: "he",
  },
  {
    id: "callmeback",
    name: { he: "Call Me Back", en: "Call Me Back" },
    homepage: "https://arkmedia.org/call-me-back/",
    feed: "https://feeds.simplecast.com/5gzMlOG1",
    lang: "en",
  },
  {
    id: "unholy",
    name: { he: "Unholy", en: "Unholy" },
    homepage: "https://unholy-podcast.com/",
    feed: "https://feeds.simplecast.com/oYXzB8F5",
    lang: "en",
  },
  {
    id: "identity",
    name: { he: "Identity/Crisis", en: "Identity/Crisis" },
    homepage: "https://www.hartman.org.il",
    feed: "https://feeds.megaphone.fm/identitycrisis",
    lang: "en",
  },
  {
    id: "israelstory",
    name: { he: "Israel Story", en: "Israel Story" },
    homepage: "https://israelstory.org",
    feed: "https://feeds.acast.com/public/shows/1353fdb5-6664-49dc-9858-fc781473a75f",
    lang: "en",
  },
  {
    id: "toidaily",
    name: { he: "TOI Daily Briefing", en: "TOI Daily Briefing" },
    homepage: "https://www.timesofisrael.com",
    feed: "https://www.omnycontent.com/d/playlist/a2539154-43b6-4c4f-b951-aca300136a80/f8a9521a-98d3-421a-a708-aca600dd355b/e96b6c46-116b-4376-aa28-aca600deea22/podcast.rss",
    lang: "en",
  },
  {
    id: "tikvah",
    name: { he: "The Tikvah Podcast", en: "The Tikvah Podcast" },
    homepage: "https://tikvahfund.org",
    feed: "https://rss.libsyn.com/shows/58385/destinations/221559.xml",
    lang: "en",
  },
  {
    id: "heaven",
    name: { he: "For Heaven’s Sake", en: "For Heaven’s Sake" },
    homepage: "https://www.hartman.org.il",
    feed: "https://rss.beehiiv.com/podcasts/01a058c8-15e5-7e18-8d3f-eb3833f763c7.xml",
    lang: "en",
  },
  {
    id: "fleisher",
    name: { he: "Yishai Fleisher", en: "Yishai Fleisher" },
    homepage: "https://yishaifleisher.com",
    feed: "https://rss.buzzsprout.com/1271258.rss",
    lang: "en",
  },
];

export const PODCAST_BY_ID = Object.fromEntries(PODCASTS.map((show) => [show.id, show])) as Record<
  PodcastId,
  PodcastShow
>;

export function podcastName(show: PodcastShow, locale: "he" | "en"): string {
  return locale === "en" ? show.name.en : show.name.he;
}
