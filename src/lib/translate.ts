import { isHebrew } from "./text";
import type { Locale } from "./i18n";

const cache = new Map<string, string>();

function cacheKey(text: string, target: Locale): string {
  return `${target}:${text}`;
}

export function needsTranslation(text: string, target: Locale): boolean {
  if (!text.trim()) return false;
  const hebrew = isHebrew(text);
  return target === "en" ? hebrew : !hebrew;
}

function firstString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const inner = firstString(item);
      if (inner) return inner;
    }
  }
  return "";
}

function cleanTranslation(value: string): string {
  return value.replace(/,(?:iw|he|en)$/i, "").trim();
}

async function fromGtx(text: string, target: Locale): Promise<string> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 Gesher/1.0" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`gtx ${response.status}`);

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("gtx shape");
  const translated = cleanTranslation(
    data[0]
      .filter((part): part is [string, ...unknown[]] => Array.isArray(part) && typeof part[0] === "string")
      .map((part) => part[0])
      .join(""),
  );
  if (!translated) throw new Error("gtx empty");
  return translated;
}

async function fromClients5(text: string, target: Locale): Promise<string> {
  const url = new URL("https://clients5.google.com/translate_a/t");
  url.searchParams.set("client", "dict-chrome-ex");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", target);
  url.searchParams.set("q", text);

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 Gesher/1.0" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`clients5 ${response.status}`);

  const translated = cleanTranslation(firstString(await response.json()));
  if (!translated) throw new Error("clients5 empty");
  return translated;
}

export async function translateText(text: string, target: Locale): Promise<string> {
  const key = cacheKey(text, target);
  const hit = cache.get(key);
  if (hit) return hit;
  if (!needsTranslation(text, target)) return text;

  let translated = text;
  try {
    translated = await fromGtx(text, target);
  } catch {
    try {
      translated = await fromClients5(text, target);
    } catch {
      translated = text;
    }
  }

  cache.set(key, translated);
  return translated;
}

async function mapPool<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => run()));
  return results;
}

export type TranslateItem = { id: string; text: string };

export async function translateItems(
  items: TranslateItem[],
  target: Locale,
): Promise<Record<string, string>> {
  const unique = new Map<string, TranslateItem>();
  for (const item of items) {
    if (item.text && !unique.has(item.id)) unique.set(item.id, item);
  }

  const entries = [...unique.values()];
  const translated = await mapPool(entries, 4, async (item) => ({
    id: item.id,
    text: await translateText(item.text.slice(0, 800), target),
  }));

  return Object.fromEntries(translated.map((item) => [item.id, item.text]));
}
