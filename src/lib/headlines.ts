import {
  HEADLINES_PER_SOURCE,
  SOURCES,
  type NewsSource,
  type SourceId,
} from "./sources";
import { cleanExcerpt, firstTag, stripHtml } from "./text";
import { parseRssDate } from "./time";
import { collectImageUrls, dropRepeatedImages, isWeakImage, upgradeImageUrl } from "./images";
import { classifyStory, type TopicId } from "./topics";

export type Headline = {
  id: string;
  sourceId: SourceId;
  title: string;
  url: string;
  publishedAt?: string;
  imageUrl?: string;
  summary?: string;
  topic: TopicId;
};

export type SourceError = {
  sourceId: SourceId;
  message: string;
};

export type HeadlinesPayload = {
  headlines: Headline[];
  fetchedAt: string;
  errors: SourceError[];
};

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Gesher/1.0",
  Accept: "application/rss+xml, application/xml, text/xml, application/json, text/html, */*",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
};

const SKIP_TITLE = /^(חדשות היום|קריקטורה|HTZ\b|Ynet\b|ynetnews|The Times of Israel|JPost\.com|מבזקי ערוץ 7|חדשות בארץ)/i;

async function fetchText(url: string, timeout = 10_000): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function itemTags(block: string): string {
  const categories = [...block.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)].map((match) =>
    stripHtml(match[1]),
  );
  return [...categories, firstTag(block, "tags")].filter(Boolean).join(" ");
}

function toHeadline(
  source: NewsSource,
  index: number,
  fields: Omit<Headline, "id" | "sourceId" | "topic"> & { tags?: string; hint?: TopicId },
): Headline | null {
  if (!fields.title || !fields.url || SKIP_TITLE.test(fields.title)) return null;
  if (!/^https?:\/\//i.test(fields.url)) return null;

  const imageUrl = fields.imageUrl && !isWeakImage(fields.imageUrl) ? upgradeImageUrl(fields.imageUrl) : undefined;

  return {
    id: `${source.id}-${fields.url}-${index}`,
    sourceId: source.id,
    title: fields.title,
    url: fields.url,
    publishedAt: fields.publishedAt,
    imageUrl,
    summary: fields.summary,
    topic: classifyStory({
      title: fields.title,
      url: fields.url,
      tags: fields.tags,
      summary: fields.summary,
      hint: fields.hint,
    }),
  };
}

function parseRssItems(
  xml: string,
  source: NewsSource,
  options: { limit?: number; hint?: TopicId } = {},
): Headline[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const limit = options.limit ?? HEADLINES_PER_SOURCE;

  return blocks
    .map((block, index) => {
      const title = firstTag(block, "title");
      const url = firstTag(block, "link") || firstTag(block, "guid");
      const publishedAt = parseRssDate(
        firstTag(block, "pubDate") || firstTag(block, "published") || firstTag(block, "dc:date"),
      );
      const description = firstTag(block, "description") || firstTag(block, "content:encoded");
      const summary = cleanExcerpt(description);
      const tags = itemTags(block);
      const image = collectImageUrls(block)[0];

      return toHeadline(source, index, {
        title: title ?? "",
        url: url ?? "",
        publishedAt,
        imageUrl: image,
        summary: summary || undefined,
        tags,
        hint: options.hint,
      });
    })
    .filter((item): item is Headline => item !== null)
    .slice(0, limit);
}

type I24Article = {
  title?: string;
  excerpt?: string;
  frontendUrl?: string;
  publishedAt?: string;
  image?: { href?: string } | null;
  category?: { name?: string; slug?: string } | null;
};

type I24Item = I24Article & {
  id?: number;
  startedAt?: string;
  content?: I24Article | null;
};

function parseI24(json: string, source: NewsSource): Headline[] {
  const items = JSON.parse(json) as I24Item[];
  if (!Array.isArray(items)) return [];

  const seen = new Set<string>();

  return items
    .map((item, index) => {
      const article = item.content && typeof item.content === "object" ? item.content : item;
      const title = (item.title || article.title || "").trim();
      const url = article.frontendUrl;
      if (!url || url === source.homepage || seen.has(url)) return null;
      seen.add(url);

      const summary = article.excerpt ? cleanExcerpt(article.excerpt) : undefined;
      const tags = [article.category?.name, article.category?.slug].filter(Boolean).join(" ");

      return toHeadline(source, index, {
        title,
        url,
        publishedAt: parseRssDate(article.publishedAt ?? item.publishedAt ?? item.startedAt ?? ""),
        imageUrl: article.image?.href,
        summary,
        tags,
      });
    })
    .filter((item): item is Headline => item !== null)
    .slice(0, HEADLINES_PER_SOURCE);
}

const WALLA_FEEDS: { url: string; hint?: TopicId }[] = [
  { url: "https://rss.walla.co.il/feed/1", hint: "local" },
  { url: "https://rss.walla.co.il/feed/2", hint: "world" },
  { url: "https://rss.walla.co.il/feed/90" },
  { url: "https://rss.walla.co.il/feed/2689", hint: "security" },
];

const WALLA_CELEB_FEEDS: { url: string; hint?: TopicId }[] = [
  { url: "https://rss.walla.co.il/feed/3601", hint: "celebs" },
  { url: "https://rss.walla.co.il/feed/3602", hint: "celebs" },
];

const ICE_CELEB = /ice\.co\.il\/(culture|media)\b/i;

async function mergeFeeds(
  source: NewsSource,
  feeds: { url: string; hint?: TopicId }[],
  limit = HEADLINES_PER_SOURCE,
): Promise<Headline[]> {
  const groups = await Promise.all(
    feeds.map(async (feed) => {
      try {
        const xml = await fetchText(feed.url);
        return parseRssItems(xml, source, { limit: 4, hint: feed.hint });
      } catch {
        return [];
      }
    }),
  );

  const seen = new Set<string>();
  const picked: Headline[] = [];
  const queues = groups.map((group) => [...group]);

  while (picked.length < limit && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item || seen.has(item.url)) continue;
        seen.add(item.url);
        picked.push(item);
        break;
      }
      if (picked.length >= limit) break;
    }
  }

  return picked;
}

async function fetchWalla(source: NewsSource): Promise<Headline[]> {
  return mergeFeeds(source, WALLA_FEEDS);
}

async function fetchWallaCelebs(source: NewsSource): Promise<Headline[]> {
  return mergeFeeds(source, WALLA_CELEB_FEEDS);
}

async function fetchIce(source: NewsSource): Promise<Headline[]> {
  const items = parseRssItems(await fetchText(source.feed), source, { limit: 24, hint: "celebs" });
  return items.filter((item) => ICE_CELEB.test(item.url)).slice(0, HEADLINES_PER_SOURCE);
}

async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const html = await fetchText(url, 6_000);
    const tagged =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const image = tagged?.[1];
    if (!image || isWeakImage(image)) return undefined;
    return upgradeImageUrl(image);
  } catch {
    return undefined;
  }
}

async function fillMissingImages(headlines: Headline[]): Promise<Headline[]> {
  const missing = headlines
    .filter((item) => {
      if (item.imageUrl) return false;
      if (/\/flashes\//i.test(item.url)) return false;
      const homepage = SOURCES.find((source) => source.id === item.sourceId)?.homepage;
      return Boolean(item.url && item.url !== homepage);
    })
    .slice(0, 28);

  const extras = new Map<string, string>();
  let cursor = 0;

  async function worker() {
    while (cursor < missing.length) {
      const current = missing[cursor];
      cursor += 1;
      const image = await fetchOgImage(current.url);
      if (image) extras.set(current.id, image);
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, missing.length) }, () => worker()));

  return headlines.map((item) => (extras.has(item.id) ? { ...item, imageUrl: extras.get(item.id) } : item));
}

async function fetchSource(source: NewsSource): Promise<Headline[]> {
  if (source.id === "walla") return fetchWalla(source);
  if (source.id === "wallacelebs") return fetchWallaCelebs(source);
  if (source.id === "ice") return fetchIce(source);
  const body = await fetchText(source.feed);
  if (source.kind === "i24") return parseI24(body, source);
  return parseRssItems(body, source, source.id === "ynetent" ? { hint: "celebs" } : {});
}

export async function fetchAllHeadlines(): Promise<HeadlinesPayload> {
  const results = await Promise.allSettled(SOURCES.map((source) => fetchSource(source)));
  let headlines: Headline[] = [];
  const errors: SourceError[] = [];

  results.forEach((result, index) => {
    const source = SOURCES[index];
    if (result.status === "fulfilled") {
      headlines.push(...result.value);
      return;
    }

    errors.push({
      sourceId: source.id,
      message: result.reason instanceof Error ? result.reason.message : "שגיאה בטעינה",
    });
  });

  headlines = dropRepeatedImages(headlines);
  headlines = await fillMissingImages(headlines);
  headlines = dropRepeatedImages(headlines);

  headlines.sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });

  return {
    headlines,
    fetchedAt: new Date().toISOString(),
    errors,
  };
}
