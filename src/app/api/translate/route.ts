import { translateItems, type TranslateItem } from "@/lib/translate";
import type { Locale } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    target?: Locale;
    items?: TranslateItem[];
  };

  const target = body.target === "en" || body.target === "he" ? body.target : null;
  const items = Array.isArray(body.items) ? body.items.slice(0, 80) : [];

  if (!target) {
    return Response.json({ error: "Invalid target" }, { status: 400 });
  }

  const translations = await translateItems(
    items.filter((item) => item?.id && typeof item.text === "string"),
    target,
  );

  return Response.json({ translations });
}
