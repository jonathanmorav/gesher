export type TopicId =
  | "politics"
  | "local"
  | "world"
  | "security"
  | "business"
  | "tech"
  | "science"
  | "sport"
  | "culture"
  | "celebs";

export const TOPICS: { id: TopicId; he: string; en: string }[] = [
  { id: "politics", he: "פוליטיקה", en: "Politics" },
  { id: "local", he: "ארץ", en: "Local" },
  { id: "world", he: "עולם", en: "World" },
  { id: "security", he: "ביטחון", en: "Security" },
  { id: "business", he: "כלכלה", en: "Business" },
  { id: "tech", he: "טכנולוגיה", en: "Tech" },
  { id: "science", he: "מדע", en: "Science" },
  { id: "sport", he: "ספורט", en: "Sports" },
  { id: "culture", he: "תרבות", en: "Culture" },
  { id: "celebs", he: "סלבס", en: "Celebs" },
];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((topic) => [topic.id, topic])) as Record<
  TopicId,
  (typeof TOPICS)[number]
>;

type Rule = { topic: TopicId; url: RegExp; words: RegExp };

const RULES: Rule[] = [
  {
    topic: "politics",
    url: /elections?|politics|primar|knesset|likud|election-magazine/i,
    words:
      /בחירות|כנסת|ליכוד|מפלג|שריון|מנדט|פריימריז|פוליטי|נתניהו|סמוטריץ|בן.?גביר|גנץ|לפיד|איזנקוט|דוברונסקי|אוחנה|חד.?ש|עוצמה יהודית|כחול לבן|election|knesset|likud|coalition|slate|primary|netanyahu|smotrich/i,
  },
  {
    topic: "security",
    url: /military|defense|security|\/war\/|iran-news|hezbollah|lebanon/i,
    words:
      /צה.?ל|חמאס|חיזבאללה|עזה|לבנון|סוריה|טהרן|ביטחון|פיגוע|תקיפה ישראלית|חטופ|גרעין|\bidf\b|hamas|hezbollah|gaza|lebanon|\biran\b|hostage|rocket|\bwar\b|nuclear|houthi|syria/i,
  },
  {
    topic: "business",
    url: /econom|business|market|finance|capital|marker/i,
    words:
      /כלכל|בורסה|אינפלצ|ריבית|שוק ההון|תקציב|נפט|business|economy|inflation|stocks|bank|budget|\boil\b|trade ban/i,
  },
  {
    topic: "tech",
    url: /tech|digital|cyber|\/ai\b/i,
    words: /טכנולוג|סייבר|בינה מלאכותית|סטארט.?אפ|\bAI\b|cyber|startup|software/i,
  },
  {
    topic: "science",
    url: /science|health|environment|climate|weather/i,
    words: /מדע|מחקר|בריאות|אקלים|מזג אוויר|science|health|climate|research|virus|covid|ozempic/i,
  },
  {
    topic: "sport",
    url: /sport|football|soccer|nba|captain/i,
    words: /ספורט|כדורגל|כדורסל|מכבי תל אביב|הפועל תל אביב|הפועל באר|ליגת העל|sport|football|soccer|\bnba\b|premier league/i,
  },
  {
    topic: "celebs",
    url: /celebs\.|\/entertainment\/|ice\.co\.il\/culture|ice\.co\.il\/media|celebrity|gossip|pplus|מפורסמים|בידור/i,
    words:
      /סלב|רכילות|מפורסמים|התארס|התגרש|פפראצ|האח הגדול|הישרדות|חתונה ממבט|רוקדים עם כוכבים|בן הזוג|בת הזוג|בלי חזייה|celebrity|gossip|paparazzi/i,
  },
  {
    topic: "culture",
    url: /culture|entertainment|food|travel|gallery|caricature|recipe|rosh-hashana/i,
    words: /תרבות|קולנוע|מוזיקה|מתכון|תייר|culture|film|music|recipe|cartoon/i,
  },
  {
    topic: "world",
    url: /world|global|international|europe|america|washington|diplomacy|britain|middle-east/i,
    words:
      /ארה.?ב|טראמפ|בריטניה|אירופה|אוקראינ|סין|צרפת|גרמני|מיאמי|קובה|ארגנטינה|פוקלנד|trump|biden|britain|ukraine|china|washington|international|miami|cuba|argentina|germany/i,
  },
  {
    topic: "local",
    url: /news-israel|\/local\/|criminal|education/i,
    words:
      /תל אביב|ירושלים|חיפה|משטרה|שוטר|תאונת|עירי[יה]|שריפה|מעיין|יקנעם|עכו|כביש|jerusalem|tel aviv|haifa/i,
  },
];

export function classifyStory(input: {
  title: string;
  url: string;
  tags?: string;
  summary?: string;
  hint?: TopicId;
}): TopicId {
  const title = input.title;
  const extra = `${input.tags ?? ""} ${input.summary ?? ""}`;
  let best: { topic: TopicId; score: number } = { topic: input.hint ?? "local", score: 0 };

  for (const rule of RULES) {
    let score = 0;
    if (rule.url.test(input.url) || (input.tags && rule.url.test(input.tags))) score += 2;
    if (rule.words.test(title)) score += 3;
    else if (rule.words.test(extra)) score += 1;
    if (score > best.score) best = { topic: rule.topic, score };
  }

  return best.topic;
}

export function topicLabel(id: TopicId, locale: "he" | "en"): string {
  return locale === "en" ? TOPIC_BY_ID[id].en : TOPIC_BY_ID[id].he;
}
