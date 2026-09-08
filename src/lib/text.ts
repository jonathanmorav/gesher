const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
};

export function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

export function decodeEntities(value: string): string {
  return stripCdata(value)
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      const key = entity.toLowerCase();
      if (key.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
      }
      if (key.startsWith("#")) {
        return String.fromCodePoint(Number(key.slice(1)));
      }
      return ENTITY_MAP[key] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(value: string): string {
  let text = value;

  for (let pass = 0; pass < 4; pass++) {
    text = decodeEntities(text)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ");

    if (!/&(?:#x?[0-9a-f]+|[a-z]+);/i.test(text) && !/<[^>]+>/.test(text)) break;
  }

  return text.replace(/\s+/g, " ").trim();
}

export function cleanExcerpt(value: string, maxLength = 420): string | undefined {
  const text = stripHtml(value)
    .replace(/The post .* appeared first on.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || /<\/?[a-z][^>]{0,80}>/i.test(text)) return undefined;
  return text.slice(0, maxLength).trim() || undefined;
}

export function extractImageUrl(xml: string): string | undefined {
  const enclosure = xml.match(
    /<enclosure[^>]+(?:type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']|url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["'])/i,
  );
  if (enclosure?.[1] || enclosure?.[2]) {
    return enclosure[1] ?? enclosure[2];
  }

  const media = xml.match(
    /<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/i,
  );
  if (media?.[1]) return media[1];

  const img = xml.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
  return img?.[1];
}

export function isHebrew(value: string): boolean {
  return /[\u0590-\u05FF]/.test(value);
}

export function firstTag(xml: string, tag: string): string {
  const named = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (named?.[1]) return decodeEntities(named[1]);

  const href = xml.match(new RegExp(`<${tag}[^>]+href=["']([^"']+)["']`, "i"));
  return href?.[1] ? decodeEntities(href[1]) : "";
}
