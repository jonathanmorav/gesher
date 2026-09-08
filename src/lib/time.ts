const TIME_ZONE = "Asia/Jerusalem";

export function israelNow(date = new Date()): Date {
  return date;
}

export function formatIsraelClock(
  date = new Date(),
  locale: "he" | "en" = "he",
): { date: string; time: string } {
  const intl = locale === "he" ? "he-IL" : "en-US";
  const datePart = new Intl.DateTimeFormat(intl, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);

  const timePart = new Intl.DateTimeFormat(intl, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).format(date);

  return { date: datePart, time: timePart };
}

export function formatRelative(iso: string, locale: "he" | "en" = "he", now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const delta = Math.max(0, now - then);
  const minutes = Math.floor(delta / 60_000);
  const hours = Math.floor(delta / 3_600_000);
  const days = Math.floor(delta / 86_400_000);

  if (locale === "en") {
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  }

  if (minutes < 1) return "עכשיו";
  if (minutes === 1) return "לפני דקה";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours === 1) return "לפני שעה";
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}

export function parseRssDate(value: string): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}
