import { decodeEntities, stripHtml } from "./text";

const JUNK =
  /checksums?:|become a supporter|become a friend of|omnystudio\.com\/listener|see omnystudio|privacy information|subscribe to|follow us|the post .* appeared first|מדי יום ראשון אנחנו מפרסמים|the latest five minute news bulletin|sha512\s*=|sha256\s*=|\bmd5\s*=|patreon|our website|bit\.ly|linktr\.ee|youtube\.com|instagram\.com|open\.spotify|podcasts\.apple|linkedin\.com|bsky\.app|\bx\.com\/|listen to (this|the|unholy|our)|the hosts\b|chutzpah award|mensch of the week|contact:|all links:|hosted by simplecast|adswizz|pcm\.adswizz|personal data|🌐|💛|📺|🎧|🎙️|📩|🔗/i;

function clip(text: string, max = 280): string {
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const stop = Math.max(sliced.lastIndexOf(". "), sliced.lastIndexOf("? "), sliced.lastIndexOf("! "));
  if (stop > 80) return sliced.slice(0, stop + 1).trim();
  const space = sliced.lastIndexOf(" ");
  return `${(space > 80 ? sliced.slice(0, space) : sliced).trim()}…`;
}

function isChapterList(text: string): boolean {
  const stamps = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g) ?? [];
  return stamps.length >= 2 || /^\d{1,2}:\d{2}/.test(text);
}

function useful(text: string): boolean {
  const value = text.replace(/\s+/g, " ").trim();
  if (value.length < 32) return false;
  if (JUNK.test(value)) return false;
  if (isChapterList(value)) return false;
  if (/https?:\/\/\S+/i.test(value) && value.length < 96) return false;
  if (/@[\w.-]+\.[a-z]{2,}/i.test(value) && value.length < 96) return false;
  if (/^[\d\s.=:_-]+$/.test(value)) return false;
  return true;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function fromLists(raw: string): string[] {
  return [...raw.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter(useful);
}

function fromBlocks(raw: string): string[] {
  return raw
    .split(/<\/(?:p|div|h[1-6]|li)>|<br\s*\/?>|\n+/i)
    .map((block) => stripHtml(block))
    .filter(useful);
}

function expand(blocks: string[]): string[] {
  const out: string[] = [];
  for (const block of blocks) {
    if (block.length > 180) {
      const sentences = splitSentences(block).filter(useful);
      if (sentences.length >= 2) {
        out.push(...sentences);
        continue;
      }
    }
    out.push(block);
  }
  return out;
}

export function extractLessons(raw: string, max = 5): string[] {
  if (!raw.trim()) return [];

  let html = raw;
  for (let pass = 0; pass < 3; pass++) {
    const next = decodeEntities(html);
    if (next === html) break;
    html = next;
  }

  const listed = fromLists(html);
  let candidates = expand(listed.length >= 2 ? listed : fromBlocks(html));

  if (candidates.length === 0) {
    candidates = splitSentences(stripHtml(html)).filter(useful);
  }

  const seen = new Set<string>();
  const lessons: string[] = [];

  for (const item of candidates) {
    const lesson = clip(item);
    const key = lesson.toLowerCase();
    if (seen.has(key) || !useful(lesson)) continue;
    seen.add(key);
    lessons.push(lesson);
    if (lessons.length >= max) break;
  }

  return lessons;
}
