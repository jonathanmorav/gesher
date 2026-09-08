"use client";

import { useEffect, useMemo, useState } from "react";
import { SOURCES, sourceName } from "@/lib/sources";
import { formatRelative } from "@/lib/time";
import { isHebrew, stripHtml } from "@/lib/text";
import { needsTranslation } from "@/lib/translate";
import type { Headline, HeadlinesPayload } from "@/lib/headlines";
import { TOPICS, topicLabel, type TopicId } from "@/lib/topics";
import { useLocale } from "./LocaleProvider";

function takeHero(items: Headline[]): { hero: Headline[]; rest: Headline[] } {
  const withPhoto = items.filter((item) => item.imageUrl);
  const without = items.filter((item) => !item.imageUrl);
  const picks = [...withPhoto, ...without].slice(0, Math.min(4, items.length));
  const used = new Set(picks.map((item) => item.id));
  return { hero: picks, rest: items.filter((item) => !used.has(item.id)) };
}

export function NewsRiver({ initial }: { initial: HeadlinesPayload }) {
  const { locale, t } = useLocale();
  const [active, setActive] = useState<TopicId | "all">("all");
  const [payload, setPayload] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  const filtered = useMemo(
    () =>
      active === "all" ? payload.headlines : payload.headlines.filter((item) => item.topic === active),
    [active, payload.headlines],
  );

  const { hero, rest } = useMemo(() => takeHero(filtered), [filtered]);

  const sections = useMemo(() => {
    if (active !== "all") return [];
    return TOPICS.map((topic) => ({
      topic: topic.id,
      items: rest.filter((item) => item.topic === topic.id),
    })).filter((section) => section.items.length > 0);
  }, [active, rest]);

  const leftover = active === "all" ? [] : rest;

  const topicCounts = useMemo(() => {
    const counts = Object.fromEntries(TOPICS.map((topic) => [topic.id, 0])) as Record<TopicId, number>;
    for (const item of payload.headlines) counts[item.topic] += 1;
    return counts;
  }, [payload.headlines]);

  useEffect(() => {
    const items = filtered.flatMap((headline) => {
      const next = [];
      const titleKey = `${locale}:${headline.id}:title`;
      const summaryKey = `${locale}:${headline.id}:summary`;
      if (needsTranslation(headline.title, locale) && !translations[titleKey]) {
        next.push({ id: titleKey, text: headline.title });
      }
      if (
        headline.summary &&
        needsTranslation(headline.summary, locale) &&
        !translations[summaryKey]
      ) {
        next.push({ id: summaryKey, text: headline.summary });
      }
      return next;
    });

    if (items.length === 0) return;

    let cancelled = false;
    setTranslating(true);

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: locale, items }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { translations?: Record<string, string> } | null) => {
        if (cancelled || !data?.translations) return;
        setTranslations((current) => ({ ...current, ...data.translations }));
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, filtered, translations]);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/headlines", { cache: "no-store" });
      if (response.ok) {
        setPayload((await response.json()) as HeadlinesPayload);
        setTranslations({});
      }
    } finally {
      setRefreshing(false);
    }
  }

  function translated(headline: Headline) {
    return {
      title: translations[`${locale}:${headline.id}:title`] ?? headline.title,
      summary: stripHtml(translations[`${locale}:${headline.id}:summary`] ?? headline.summary ?? "") || undefined,
    };
  }

  return (
    <section className="river">
      <div className="river-toolbar">
        <div className="filters" role="tablist" aria-label={t("filterAria")}>
          <button
            type="button"
            className={`chip ${active === "all" ? "active" : ""}`}
            onClick={() => setActive("all")}
          >
            {t("all")}
          </button>
          {TOPICS.filter((topic) => topicCounts[topic.id] > 0).map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={`chip ${active === topic.id ? "active" : ""}`}
              onClick={() => setActive(topic.id)}
            >
              {topicLabel(topic.id, locale)}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          {translating && <span className="translate-status">{t("translating")}</span>}
          <button type="button" className="refresh" onClick={refresh} disabled={refreshing}>
            {refreshing ? t("refreshing") : t("refresh")}
          </button>
        </div>
      </div>

      {payload.errors.length > 0 && (
        <p className="source-note">
          {t("sourceFail")}{" "}
          {payload.errors
            .map((error) => {
              const source = SOURCES.find((item) => item.id === error.sourceId);
              return source ? sourceName(source, locale) : error.sourceId;
            })
            .join(", ")}
        </p>
      )}

      <div className="magazine">
        {hero.length > 0 && (
          <div className={`spread ${hero.length === 1 ? "solo" : ""}`}>
            {hero.map((headline, index) => {
              const copy = translated(headline);
              return (
                <StoryTile
                  key={headline.id}
                  headline={headline}
                  cover={index === 0}
                  fetchedAt={payload.fetchedAt}
                  title={copy.title}
                  summary={copy.summary}
                />
              );
            })}
          </div>
        )}

        {sections.map((section) => (
          <div key={section.topic} className="topic-block">
            <h3 className="topic-heading">{topicLabel(section.topic, locale)}</h3>
            <div className="mosaic">
              {section.items.map((headline) => {
                const copy = translated(headline);
                return (
                  <StoryTile
                    key={headline.id}
                    headline={headline}
                    cover={false}
                    fetchedAt={payload.fetchedAt}
                    title={copy.title}
                    summary={copy.summary}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {leftover.length > 0 && (
          <div className="mosaic">
            {leftover.map((headline) => {
              const copy = translated(headline);
              return (
                <StoryTile
                  key={headline.id}
                  headline={headline}
                  cover={false}
                  fetchedAt={payload.fetchedAt}
                  title={copy.title}
                  summary={copy.summary}
                />
              );
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 && <p className="empty">{t("empty")}</p>}
    </section>
  );
}

function RelativeTime({ iso, fetchedAt }: { iso: string; fetchedAt: string }) {
  const { locale } = useLocale();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatRelative(iso, locale, now ?? Date.parse(fetchedAt))}
    </time>
  );
}

function StoryTile({
  headline,
  cover,
  fetchedAt,
  title,
  summary,
}: {
  headline: Headline;
  cover: boolean;
  fetchedAt: string;
  title: string;
  summary?: string;
}) {
  const { locale, t } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  const [photo, setPhoto] = useState(Boolean(headline.imageUrl));

  useEffect(() => {
    setPhoto(Boolean(headline.imageUrl));
  }, [headline.imageUrl]);

  if (!source) return null;

  const publisher = sourceName(source, locale);

  return (
    <article className={`tile ${cover ? "cover" : "stack"} ${photo ? "has-photo" : "no-photo"}`}>
      <div className="tile-link">
        <div className="tile-media">
          {photo && headline.imageUrl && (
            <img
              src={headline.imageUrl}
              alt=""
              className="tile-photo"
              loading={cover ? "eager" : "lazy"}
              decoding="async"
              sizes={cover ? "(max-width: 900px) 100vw, 58vw" : "(max-width: 900px) 100vw, 32vw"}
              onError={() => setPhoto(false)}
            />
          )}
        </div>
        <div className="tile-copy">
          <div className="tile-meta">
            <span className="source-pill">{publisher}</span>
            <span className="topic-pill">{topicLabel(headline.topic, locale)}</span>
            {headline.publishedAt && (
              <RelativeTime iso={headline.publishedAt} fetchedAt={fetchedAt} />
            )}
          </div>
          <h2 suppressHydrationWarning className={isHebrew(title) ? "he" : "en"}>
            {title}
          </h2>
          {summary && <p className="dek">{summary}</p>}
          <a href={headline.url} target="_blank" rel="noopener noreferrer" className="outbound">
            {t("readOn")} {publisher}
          </a>
        </div>
      </div>
    </article>
  );
}
