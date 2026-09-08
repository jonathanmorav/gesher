export type StationId =
  | "galgalatz"
  | "galatz"
  | "kanbet"
  | "radio103"
  | "eco99"
  | "kan88"
  | "i24he"
  | "i24"
  | "intr"
  | "ivr";

export type Station = {
  id: StationId;
  name: { he: string; en: string };
  freq?: string;
  lang: "he" | "en";
  streams: string[];
  blurb: { he: string; en: string };
};

export const STATIONS: Station[] = [
  {
    id: "galgalatz",
    name: { he: "גלגלצ", en: "Galgalatz" },
    freq: "91.8 FM",
    lang: "he",
    streams: ["https://glzwizzlv.bynetcdn.com/glglz_mp3", "https://glzicylv01.bynetcdn.com/glglz_mp3"],
    blurb: {
      he: "המוזיקה והחדשות של גלי צה״ל",
      en: "IDF Radio’s music and news",
    },
  },
  {
    id: "galatz",
    name: { he: "גל״צ", en: "Galatz" },
    freq: "102 FM",
    lang: "he",
    streams: ["https://glzwizzlv.bynetcdn.com/glz_mp3", "https://glzicylv01.bynetcdn.com/glz_mp3"],
    blurb: {
      he: "החדשות והאקטואליה של גלי צה״ל",
      en: "IDF Radio’s news and current affairs",
    },
  },
  {
    id: "kanbet",
    name: { he: "כאן ב׳", en: "Kan Bet" },
    freq: "KAN",
    lang: "he",
    streams: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_BET.mp3",
      "https://28563.live.streamtheworld.com/KAN_BET.mp3",
    ],
    blurb: {
      he: "חדשות ואקטואליה של תאגיד השידור",
      en: "Kan’s public news radio",
    },
  },
  {
    id: "radio103",
    name: { he: "103FM", en: "103FM" },
    freq: "103 FM",
    lang: "he",
    streams: ["https://cdn.cybercdn.live/103FM/Live/icecast.audio"],
    blurb: {
      he: "שיחות, חדשות ופרשנות",
      en: "Commercial talk, news, and commentary",
    },
  },
  {
    id: "eco99",
    name: { he: "eco99", en: "eco99" },
    freq: "99 FM",
    lang: "he",
    streams: ["https://eco01.livecdn.biz/ecolive/99fm_aac/icecast.audio"],
    blurb: {
      he: "מוזיקה רציפה — ישראלי ובינלאומי",
      en: "Continuous Israeli and international music",
    },
  },
  {
    id: "kan88",
    name: { he: "כאן 88", en: "Kan 88" },
    freq: "88 FM",
    lang: "he",
    streams: [
      "https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_88.mp3",
      "https://29073.live.streamtheworld.com/KAN_88.mp3",
    ],
    blurb: {
      he: "המוזיקה של תאגיד השידור",
      en: "Kan’s music station",
    },
  },
  {
    id: "i24he",
    name: { he: "i24 עב", en: "i24 HE" },
    freq: "עב",
    lang: "he",
    streams: ["https://i24newshebrewradio-cdn.encoders.immergo.tv/master.m3u8"],
    blurb: {
      he: "חדשות בשידור חי מ־i24NEWS",
      en: "i24NEWS Hebrew radio, live",
    },
  },
  {
    id: "i24",
    name: { he: "i24 EN", en: "i24 EN" },
    freq: "EN",
    lang: "en",
    streams: ["https://i24newsenglishradio-cdn.encoders.immergo.tv/master.m3u8"],
    blurb: {
      he: "חדשות באנגלית מ־i24NEWS",
      en: "i24NEWS English radio, live from Tel Aviv",
    },
  },
  {
    id: "intr",
    name: { he: "INTR", en: "INTR" },
    freq: "EN",
    lang: "en",
    streams: ["https://dallas.audio-stream.com/proxy/israelne?mp=/live_live"],
    blurb: {
      he: "Israel News Talk Radio — שידור חי באנגלית",
      en: "Israel News Talk Radio — live English talk",
    },
  },
  {
    id: "ivr",
    name: { he: "IVR", en: "IVR" },
    freq: "EN",
    lang: "en",
    streams: ["https://icecast.live/ivr"],
    blurb: {
      he: "Israeli Voice Radio — אנגלית בשידור חי",
      en: "Israeli Voice Radio — live English",
    },
  },
];

export const STATION_BY_ID = Object.fromEntries(STATIONS.map((station) => [station.id, station])) as Record<
  StationId,
  Station
>;

export const DEFAULT_STATION_ID: StationId = "galgalatz";
export const STATION_STORAGE_KEY = "klali-station";

export function isStationId(value: string | null): value is StationId {
  return Boolean(value && value in STATION_BY_ID);
}

export function stationName(station: Station, locale: "he" | "en"): string {
  return locale === "en" ? station.name.en : station.name.he;
}
