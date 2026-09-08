const WEAK_IMAGE =
  /htz-share|\/0\/0\.jpg|favicon|sprite|placeholder|default[-_]?image|logo[-_]?only|3751628-46|1034351/i;

export function imageFingerprint(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split("/").filter(Boolean).slice(-2).join("/");
  } catch {
    return url;
  }
}

export function isWeakImage(url: string): boolean {
  return !url || !/^https?:\/\//i.test(url) || WEAK_IMAGE.test(url);
}

export function upgradeImageUrl(url: string): string {
  let next = url.trim();

  next = next.replace(/w_(?:150|200|240|300|400|480)(?!\d)/, "w_1200");
  next = next.replace(/([?&]width=)\d+/i, "$11200");
  next = next.replace(/_(?:small|medium|thumb)\.(jpe?g|png|webp)/i, "_large.$1");
  next = next.replace(/c_fill,g_faces:center,h_\d+,w_\d+/i, "c_fill,g_faces:center,h_800,w_1200");
  next = next.replace(/\/(?:150|200|300|400)\/(?:150|200|300|400)\//, "/1200/800/");

  if (next.includes("img.haarets.co.il") && !/[?&]width=/i.test(next)) {
    next += (next.includes("?") ? "&" : "?") + "width=1200";
  }

  return next;
}

export function collectImageUrls(xml: string): string[] {
  const decoded = xml
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");

  const haystacks = [xml, decoded];
  const found: string[] = [];

  for (const haystack of haystacks) {
    const enclosure = haystack.matchAll(
      /<enclosure[^>]+(?:type=["']image\/[^"']+["'][^>]+url=["']([^"']+)["']|url=["']([^"']+)["'])/gi,
    );
    for (const match of enclosure) {
      found.push(match[1] ?? match[2] ?? "");
    }

    const media = haystack.matchAll(/<(?:media:content|media:thumbnail)[^>]+url=["']([^"']+)["']/gi);
    for (const match of media) found.push(match[1]);

    const imgs = haystack.matchAll(/<img[^>]+src=['"]([^'"]+)['"]/gi);
    for (const match of imgs) found.push(match[1]);
  }

  return [...new Set(found.map((url) => upgradeImageUrl(url)).filter((url) => !isWeakImage(url)))];
}

export function dropRepeatedImages<T extends { imageUrl?: string }>(items: T[]): T[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.imageUrl) continue;
    const key = imageFingerprint(item.imageUrl);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return items.map((item) => {
    if (!item.imageUrl) return item;
    const key = imageFingerprint(item.imageUrl);
    if ((counts.get(key) ?? 0) < 3) return item;
    return { ...item, imageUrl: undefined };
  });
}
