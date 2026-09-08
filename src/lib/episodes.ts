import { isWeakImage, upgradeImageUrl } from "./images";
import { extractLessons } from "./lessons";
import { PODCASTS, type PodcastId, type PodcastShow } from "./podcasts";
import { cleanExcerpt, extractImageUrl, firstTag } from "./text";
import { parseRssDate } from "./time";

export type Episode = {
  id: string;
  showId: PodcastId;
  title: string;
  url: string;
  audioUrl: string;
  publishedAt?: string;
  imageUrl?: string;
  summary?: string;
  lessons: string[];
};

export type EpisodeError = {
  showId: PodcastId;
  message: string;
};

export type EpisodesPayload = {
  episodes: Episode[];
  fetchedAt: string;
  errors: EpisodeError[];
};

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Gesher/1.0",
  Accept: "application/rss+xml, application/xml, text/xml, application/json, */*",
  "Accept-Language": "he-IL,he;q=0.9,en;q=0.8",
};

async function fetchText(url: string, timeout = 12_000): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function cleanImage(url?: string): string | undefined {
  if (!url || isWeakImage(url)) return undefined;
  return upgradeImageUrl(url);
}

function channelImage(xml: string): string | undefined {
  const itunes = xml.match(/<itunes:image[^>]+href=["']([^"']+)["']/i)?.[1];
  if (itunes) return cleanImage(itunes);
  const url = xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i)?.[1];
  return cleanImage(url);
}

function enclosureUrl(block: string): string {
  const typed = block.match(
    /<enclosure[^>]+(?:type=["']audio\/[^"']+["'][^>]+url=["']([^"']+)["']|url=["']([^"']+)["'][^>]+type=["']audio\/[^"']+["'])/i,
  );
  if (typed?.[1] || typed?.[2]) return typed[1] ?? typed[2] ?? "";

  const any = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] ?? "";
  if (/\.(mp3|m4a|aac|mp4|ogg)(\?|$)/i.test(any) || /audio/i.test(any)) return any;

  const media = block.match(
    /<media:content[^>]+(?:medium=["']audio["'][^>]+url=["']([^"']+)["']|url=["']([^"']+)["'][^>]+(?:medium=["']audio["']|type=["']audio\/))/i,
  );
  return media?.[1] ?? media?.[2] ?? "";
}

function parseLatestEpisode(xml: string, show: PodcastShow): Episode | null {
  const block = xml.match(/<item\b[\s\S]*?<\/item>/i)?.[0];
  if (!block) return null;

  const title = firstTag(block, "title");
  const url = firstTag(block, "link") || firstTag(block, "guid") || show.homepage;
  const audioUrl = enclosureUrl(block);
  if (!title || !audioUrl) return null;

  const publishedAt = parseRssDate(
    firstTag(block, "pubDate") || firstTag(block, "published") || firstTag(block, "dc:date"),
  );
  const description = firstTag(block, "description") || firstTag(block, "itunes:summary") || firstTag(block, "content:encoded");
  const lessons = extractLessons(description);
  const summary = cleanExcerpt(description, 320)?.replace(/Checksums?:.*$/i, "").trim();
  const imageUrl =
    cleanImage(block.match(/<itunes:image[^>]+href=["']([^"']+)["']/i)?.[1]) ||
    cleanImage(extractImageUrl(block)) ||
    channelImage(xml);

  return {
    id: `${show.id}-${url || audioUrl}`,
    showId: show.id,
    title,
    url: /^https?:\/\//i.test(url) ? url : show.homepage,
    audioUrl,
    publishedAt,
    imageUrl,
    summary: summary || undefined,
    lessons,
  };
}

async function fetchShow(show: PodcastShow): Promise<Episode> {
  const xml = await fetchText(show.feed);
  const episode = parseLatestEpisode(xml, show);
  if (!episode) throw new Error("no episode");
  return episode;
}

export async function fetchAllEpisodes(): Promise<EpisodesPayload> {
  const results = await Promise.allSettled(PODCASTS.map((show) => fetchShow(show)));
  const episodes: Episode[] = [];
  const errors: EpisodeError[] = [];

  results.forEach((result, index) => {
    const show = PODCASTS[index];
    if (result.status === "fulfilled") {
      episodes.push(result.value);
      return;
    }
    errors.push({
      showId: show.id,
      message: result.reason instanceof Error ? result.reason.message : "שגיאה בטעינה",
    });
  });

  episodes.sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return bTime - aTime;
  });

  return {
    episodes,
    fetchedAt: new Date().toISOString(),
    errors,
  };
}
