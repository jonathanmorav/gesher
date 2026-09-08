export type Locale = "he" | "en";

export const LOCALE_STORAGE_KEY = "klali-locale";

export const UI = {
  kicker: { he: "ישראל · כותרות · רדיו", en: "Israel · Headlines · Radio" },
  tagline: {
    he: "הכותרות מהאתרים המובילים. רדיו בשידור חי.",
    en: "Headlines from Israel’s leading newsrooms. Live radio.",
  },
  navAria: { he: "ניווט האתר", en: "Site" },
  navHeadlines: { he: "כותרות", en: "Headlines" },
  navPodcasts: { he: "פודקאסטים", en: "Podcasts" },
  podcastsLead: {
    he: "הפרקים האחרונים מפודקאסטים על ישראל ועל החיים היהודיים בעולם. לחצו לכרטיס לעיקרים מהפיד. האזנה מפעילה את הפרק.",
    en: "Latest episodes from podcasts on Israel and Jewish life. Click a card for key lessons from the feed. Listen starts the episode.",
  },
  podcastsColophon: {
    he: "גשר מציג כותרות, עיקרים וקבצי האודיו שההסכתים עצמם מפרסמים בפיד. הפרק המלא והתמליל נשארים אצל המקור.",
    en: "Gesher shows titles, key lessons, and the audio file each show publishes in its feed. The full episode page stays with the publisher.",
  },
  podcastEmpty: { he: "אין פרקים זמינים כרגע.", en: "No episodes available right now." },
  lessons: { he: "עיקרים מהפרק", en: "Key lessons" },
  lessonsHint: { he: "לחצו לעיקרים", en: "Open key lessons" },
  lessonsEmpty: {
    he: "הפיד של הפרק הזה לא כולל עיקרים.",
    en: "This episode’s feed didn’t include key lessons.",
  },
  lessonsAria: { he: "עיקרים מהפרק", en: "Episode key lessons" },
  close: { he: "סגירה", en: "Close" },
  listen: { he: "האזנה", en: "Listen" },
  nowPlaying: { he: "מתנגן", en: "Now playing" },
  shows: { he: "הסכתים", en: "Shows" },
  all: { he: "הכל", en: "All" },
  topStories: { he: "כותרות ראשיות", en: "Top Stories" },
  mostPopular: { he: "הכי נקראות", en: "Most Popular" },
  freeToRead: { he: "לקריאה חופשית", en: "Free to read" },
  refreshesDaily: { he: "מתעדכן עם הפידים", en: "Refreshes with the feeds" },
  seeAllPodcasts: { he: "כל הפודקאסטים ←", en: "See all podcasts →" },
  refresh: { he: "רענון", en: "Refresh" },
  refreshing: { he: "מרענן…", en: "Refreshing…" },
  translating: { he: "מתרגם…", en: "Translating…" },
  filterAria: { he: "סינון נושאים", en: "Filter topics" },
  sourceFail: { he: "לא הצלחנו לטעון כרגע:", en: "Couldn’t load just now:" },
  empty: { he: "אין כותרות בנושא הזה כרגע.", en: "No headlines in this topic right now." },
  readOn: { he: "המשך באתר", en: "Continue on" },
  colophon: {
    he: "גשר מציג כותרות ותקצירים מהפידים הרשמיים. הסיפור המלא נשאר אצל המקור.",
    en: "Gesher shows headlines and feed excerpts. The full story stays with the original newsroom.",
  },
  sources: { he: "מקורות", en: "Sources" },
  live: { he: "שידור חי", en: "Live" },
  stationsAria: { he: "תחנות רדיו", en: "Radio stations" },
  radioBlurb: {
    he: "בחרו תחנה והאזינו בלי לעזוב את הכותרות",
    en: "Pick a station without leaving the headlines",
  },
  play: { he: "נגן", en: "Play" },
  pause: { he: "השהה", en: "Pause" },
  volume: { he: "עוצמה", en: "Volume" },
  playError: { he: "לא ניתן להפעיל את השידור", en: "Couldn’t start the stream" },
  streamDown: { he: "השידור לא זמין כרגע", en: "The stream is unavailable right now" },
  language: { he: "שפה", en: "Language" },
  privacy: { he: "פרטיות", en: "Privacy" },
  support: { he: "תמיכה", en: "Support" },
  privacyLead: {
    he: "גשר לא דורש חשבון ולא אוסף מזהים. ההעדפות נשמרות במכשיר.",
    en: "Gesher does not require an account and does not collect identifiers. Preferences stay on your device.",
  },
} as const;

export type UiKey = keyof typeof UI;

export function t(key: UiKey, locale: Locale): string {
  return UI[key][locale];
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
}
