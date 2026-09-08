"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Episode } from "@/lib/episodes";
import { SOURCES, sourceName } from "@/lib/sources";
import { formatRelative } from "@/lib/time";
import { isHebrew, stripHtml } from "@/lib/text";
import { needsTranslation } from "@/lib/translate";
import type { Headline, HeadlinesPayload } from "@/lib/headlines";
import { PODCAST_BY_ID, podcastName } from "@/lib/podcasts";
import { TOPICS, topicLabel, type TopicId } from "@/lib/topics";
import { useLocale } from "./LocaleProvider";

function takeLead(items: Headline[]): { hero?: Headline; top: Headline[]; rest: Headline[] } {
  const withPhoto = items.filter((item) => item.imageUrl);
  const without = items.filter((item) => !item.imageUrl);
  const ordered = [...withPhoto, ...without];
  const hero = ordered[0];
  const top = ordered.slice(1, 6);
  const used = new Set([hero, ...top].filter(Boolean).map((item) => item.id));
  return { hero, top, rest: items.filter((item) => !used.has(item.id)) };
}

export function NewsRiver({
  initial,
  podcasts = [],
}: {
  initial: HeadlinesPayload;
  podcasts?: Episode[];
}) {
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

  const { hero, top, rest } = useMemo(() => takeLead(filtered), [filtered]);

  const { free, popular, streamItems } = useMemo(() => {
    const nextFree = rest.slice(0, 3);
    const afterFree = rest.slice(3);
    const nextPopular = afterFree.filter((item) => item.imageUrl).slice(0, 5);
    const popularIds = new Set(nextPopular.map((item) => item.id));
    return {
      free: nextFree,
      popular: nextPopular,
      streamItems: afterFree.filter((item) => !popularIds.has(item.id)),
    };
  }, [rest]);

  const sections = useMemo(() => {
    if (active !== "all") return [];
    return TOPICS.map((topic) => ({
      topic: topic.id,
      items: streamItems.filter((item) => item.topic === topic.id),
    })).filter((section) => section.items.length > 0);
  }, [active, streamItems]);

  const leftover = active === "all" ? [] : streamItems;

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
        {(hero || top.length > 0) && (
          <div className={`lead-grid ${hero ? "" : "no-hero"}`}>
            {hero && (
              <HeroStory
                headline={hero}
                fetchedAt={payload.fetchedAt}
                title={translated(hero).title}
                summary={translated(hero).summary}
              />
            )}
            {top.length > 0 && (
              <aside className="panel">
                <h3 className="section-label">{t("topStories")}</h3>
                <ol className="ranked-list">
                  {top.map((headline, index) => {
                    const copy = translated(headline);
                    return (
                      <li key={headline.id}>
                        <RankedStory
                          headline={headline}
                          number={index + 1}
                          fetchedAt={payload.fetchedAt}
                          title={copy.title}
                        />
                      </li>
                    );
                  })}
                </ol>
              </aside>
            )}
          </div>
        )}

        {free.length > 0 && (
          <aside className="free-card">
            <div className="free-head">
              <h3 className="section-label">{t("freeToRead")}</h3>
              <p className="free-kicker">{t("refreshesDaily")}</p>
            </div>
            <div className="free-list">
              {free.map((headline) => {
                const copy = translated(headline);
                return (
                  <FreeStory
                    key={headline.id}
                    headline={headline}
                    fetchedAt={payload.fetchedAt}
                    title={copy.title}
                  />
                );
              })}
            </div>
          </aside>
        )}

        <div className="stream-grid">
          <div className="stream">
            {sections.map((section) => (
              <div key={section.topic} className="topic-block">
                <h3 className="section-label">{topicLabel(section.topic, locale)}</h3>
                <div className="story-list">
                  {section.items.map((headline) => {
                    const copy = translated(headline);
                    return (
                      <StoryRow
                        key={headline.id}
                        headline={headline}
                        fetchedAt={payload.fetchedAt}
                        title={copy.title}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {leftover.length > 0 && (
              <div className="story-list">
                {leftover.map((headline) => {
                  const copy = translated(headline);
                  return (
                    <StoryRow
                      key={headline.id}
                      headline={headline}
                      fetchedAt={payload.fetchedAt}
                      title={copy.title}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {(popular.length > 0 || podcasts.length > 0) && (
            <div className="rail">
              {popular.length > 0 && (
                <aside className="color-card popular-card">
                  <h3 className="color-card-label">{t("mostPopular")}</h3>
                  <ol className="ranked-list">
                    {popular.map((headline, index) => {
                      const copy = translated(headline);
                      return (
                        <li key={headline.id}>
                          <RankedStory
                            headline={headline}
                            number={index + 1}
                            fetchedAt={payload.fetchedAt}
                            title={copy.title}
                            tone="color"
                          />
                        </li>
                      );
                    })}
                  </ol>
                </aside>
              )}

              {podcasts.length > 0 && (
                <aside className="color-card podcasts-card">
                  <div className="color-card-head">
                    <h3 className="color-card-label">{t("navPodcasts")}</h3>
                    <Link href="/podcasts" className="see-all">
                      {t("seeAllPodcasts")}
                    </Link>
                  </div>
                  <ol className="ranked-list">
                    {podcasts.map((episode, index) => (
                      <li key={episode.id}>
                        <PodcastRanked episode={episode} number={index + 1} fetchedAt={payload.fetchedAt} />
                      </li>
                    ))}
                  </ol>
                </aside>
              )}
            </div>
          )}
        </div>
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

function StoryThumb({
  src,
  className,
  eager,
}: {
  src?: string;
  className: string;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const ok = Boolean(src) && src !== failedSrc;

  if (!ok || !src) return <div className={`${className} is-empty`} aria-hidden />;

  return (
    <img
      src={src}
      alt=""
      className={className}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
}

function Byline({
  source,
  topic,
  publishedAt,
  fetchedAt,
  tone = "plain",
}: {
  source: string;
  topic?: string;
  publishedAt?: string;
  fetchedAt: string;
  tone?: "plain" | "color";
}) {
  return (
    <div className={`byline ${tone}`}>
      <span className="source-pill">{source}</span>
      {topic && <span className="topic-pill">{topic}</span>}
      {publishedAt && (
        <span className="meta">
          <RelativeTime iso={publishedAt} fetchedAt={fetchedAt} />
        </span>
      )}
    </div>
  );
}

function HeroStory({
  headline,
  fetchedAt,
  title,
  summary,
}: {
  headline: Headline;
  fetchedAt: string;
  title: string;
  summary?: string;
}) {
  const { locale } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  if (!source) return null;

  const photo = Boolean(headline.imageUrl);

  return (
    <article className={`hero ${photo ? "has-photo" : "no-photo"}`}>
      <a href={headline.url} target="_blank" rel="noopener noreferrer" className="hero-link">
        <StoryThumb src={headline.imageUrl} className="hero-photo" eager />
        <div className="hero-copy">
          <h2 suppressHydrationWarning className={`hero-headline ${isHebrew(title) ? "he" : "en"}`}>
            {title}
          </h2>
          {summary && <p className="hero-dek">{summary}</p>}
          <Byline
            source={sourceName(source, locale)}
            topic={topicLabel(headline.topic, locale)}
            publishedAt={headline.publishedAt}
            fetchedAt={fetchedAt}
          />
        </div>
      </a>
    </article>
  );
}

function RankedStory({
  headline,
  number,
  fetchedAt,
  title,
  tone = "plain",
}: {
  headline: Headline;
  number: number;
  fetchedAt: string;
  title: string;
  tone?: "plain" | "color";
}) {
  const { locale } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  if (!source) return null;

  return (
    <a href={headline.url} target="_blank" rel="noopener noreferrer" className={`ranked-row ${tone}`}>
      <span className="ranked-num">{number}</span>
      <div className="ranked-copy">
        <h4 suppressHydrationWarning className={`ranked-title ${isHebrew(title) ? "he" : "en"}`}>
          {title}
        </h4>
        <Byline
          source={sourceName(source, locale)}
          publishedAt={headline.publishedAt}
          fetchedAt={fetchedAt}
          tone={tone}
        />
      </div>
      <StoryThumb src={headline.imageUrl} className="ranked-thumb" />
    </a>
  );
}

function FreeStory({
  headline,
  fetchedAt,
  title,
}: {
  headline: Headline;
  fetchedAt: string;
  title: string;
}) {
  const { locale } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  if (!source) return null;

  return (
    <a href={headline.url} target="_blank" rel="noopener noreferrer" className="free-item">
      <StoryThumb src={headline.imageUrl} className="free-thumb" />
      <div className="free-copy">
        <h4 suppressHydrationWarning className={`ranked-title ${isHebrew(title) ? "he" : "en"}`}>
          {title}
        </h4>
        <Byline
          source={sourceName(source, locale)}
          publishedAt={headline.publishedAt}
          fetchedAt={fetchedAt}
        />
      </div>
    </a>
  );
}

function StoryRow({
  headline,
  fetchedAt,
  title,
}: {
  headline: Headline;
  fetchedAt: string;
  title: string;
}) {
  const { locale } = useLocale();
  const source = SOURCES.find((item) => item.id === headline.sourceId);
  if (!source) return null;

  return (
    <a href={headline.url} target="_blank" rel="noopener noreferrer" className="story-row">
      <div className="story-copy">
        <h3 suppressHydrationWarning className={`story-title ${isHebrew(title) ? "he" : "en"}`}>
          {title}
        </h3>
        <Byline
          source={sourceName(source, locale)}
          topic={topicLabel(headline.topic, locale)}
          publishedAt={headline.publishedAt}
          fetchedAt={fetchedAt}
        />
      </div>
      <StoryThumb src={headline.imageUrl} className="story-thumb" />
    </a>
  );
}

function PodcastRanked({
  episode,
  number,
  fetchedAt,
}: {
  episode: Episode;
  number: number;
  fetchedAt: string;
}) {
  const { locale } = useLocale();
  const show = PODCAST_BY_ID[episode.showId];

  return (
    <a href={episode.url} target="_blank" rel="noopener noreferrer" className="ranked-row color">
      <span className="ranked-num">{number}</span>
      <div className="ranked-copy">
        <h4 className={`ranked-title ${isHebrew(episode.title) ? "he" : "en"}`}>{episode.title}</h4>
        <Byline
          source={podcastName(show, locale)}
          publishedAt={episode.publishedAt}
          fetchedAt={fetchedAt}
          tone="color"
        />
      </div>
      <StoryThumb src={episode.imageUrl} className="ranked-thumb" />
    </a>
  );
}
