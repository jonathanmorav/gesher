"use client";

import { useEffect, useRef, useState } from "react";
import { PODCAST_BY_ID, PODCASTS, podcastName } from "@/lib/podcasts";
import type { Episode, EpisodesPayload } from "@/lib/episodes";
import { needsTranslation } from "@/lib/translate";
import { isHebrew, stripHtml } from "@/lib/text";
import { formatRelative } from "@/lib/time";
import { useLocale } from "./LocaleProvider";

export function PodcastBoard({ initial }: { initial: EpisodesPayload }) {
  const { locale, t } = useLocale();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [payload] = useState(initial);
  const [currentId, setCurrentId] = useState(payload.episodes[0]?.id ?? "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);

  const current = payload.episodes.find((episode) => episode.id === currentId) ?? payload.episodes[0];
  const opened = payload.episodes.find((episode) => episode.id === openId) ?? null;

  useEffect(() => {
    const items = payload.episodes.flatMap((episode) => {
      const next = [];
      const titleKey = `${locale}:${episode.id}:title`;
      if (needsTranslation(episode.title, locale) && !translations[titleKey]) {
        next.push({ id: titleKey, text: episode.title });
      }
      episode.lessons.forEach((lesson, index) => {
        const lessonKey = `${locale}:${episode.id}:lesson:${index}`;
        if (needsTranslation(lesson, locale) && !translations[lessonKey]) {
          next.push({ id: lessonKey, text: lesson });
        }
      });
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
        setTranslations((existing) => ({ ...existing, ...data.translations }));
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [locale, payload.episodes, translations]);

  useEffect(() => {
    if (!opened) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenId(null);
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [opened]);

  function copy(episode: Episode) {
    return {
      title: translations[`${locale}:${episode.id}:title`] ?? episode.title,
      lessons: episode.lessons
        .map((lesson, index) =>
          stripHtml(translations[`${locale}:${episode.id}:lesson:${index}`] ?? lesson),
        )
        .filter(Boolean),
    };
  }

  async function play(episode: Episode) {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentId(episode.id);
    if (audio.src !== episode.audioUrl) audio.src = episode.audioUrl;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function toggle(episode: Episode) {
    if (current?.id === episode.id && playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    void play(episode);
  }

  return (
    <section className="river">
      <div className="page-head">
        <h1>{t("navPodcasts")}</h1>
        <p className="page-lead">{t("podcastsLead")}</p>
      </div>

      {current && (
        <div className="episode-player">
          <div className="episode-player-inner">
            {current.imageUrl ? (
              <img src={current.imageUrl} alt="" className="episode-art" />
            ) : (
              <div className="episode-art" />
            )}
            <div className="episode-player-copy">
              <strong className={isHebrew(copy(current).title) ? "he" : "en"}>{copy(current).title}</strong>
              <span>
                {t("nowPlaying")} · {podcastName(PODCAST_BY_ID[current.showId], locale)}
              </span>
            </div>
            <button type="button" className={`play-ep ${playing ? "ghost" : ""}`} onClick={() => toggle(current)}>
              {playing ? t("pause") : t("listen")}
            </button>
            <audio
              ref={audioRef}
              controls
              preload="none"
              src={current.audioUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => setPlaying(false)}
            />
          </div>
        </div>
      )}

      <div className="river-toolbar">
        <div />
        <div className="toolbar-actions">
          {translating && <span className="translate-status">{t("translating")}</span>}
        </div>
      </div>

      {payload.errors.length > 0 && (
        <p className="source-note">
          {t("sourceFail")}{" "}
          {payload.errors
            .map((error) => {
              const show = PODCASTS.find((item) => item.id === error.showId);
              return show ? podcastName(show, locale) : error.showId;
            })
            .join(", ")}
        </p>
      )}

      <div className="magazine">
        <div className="mosaic">
          {payload.episodes.map((episode) => {
            const show = PODCAST_BY_ID[episode.showId];
            const text = copy(episode);
            const selected = episode.id === current?.id;
            return (
              <article
                key={episode.id}
                className={`tile stack is-openable ${episode.imageUrl ? "has-photo" : "no-photo"} ${selected && playing ? "playing" : ""} ${openId === episode.id ? "is-open" : ""}`}
              >
                <button type="button" className="tile-hit" onClick={() => setOpenId(episode.id)}>
                  <div className="tile-media">
                    {episode.imageUrl && (
                      <img src={episode.imageUrl} alt="" className="tile-photo" loading="lazy" decoding="async" />
                    )}
                  </div>
                  <div className="tile-copy">
                    <div className="tile-meta">
                      <span className="source-pill">{podcastName(show, locale)}</span>
                      {episode.publishedAt && (
                        <time dateTime={episode.publishedAt}>
                          {formatRelative(episode.publishedAt, locale, Date.parse(payload.fetchedAt))}
                        </time>
                      )}
                    </div>
                    <h2 className={isHebrew(text.title) ? "he" : "en"}>{text.title}</h2>
                    <span className="lesson-hint">{t("lessonsHint")}</span>
                  </div>
                </button>
                <div className="tile-actions">
                  <button type="button" className={`play-ep ${selected && playing ? "ghost" : ""}`} onClick={() => toggle(episode)}>
                    {selected && playing ? t("pause") : t("listen")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {payload.episodes.length === 0 && <p className="empty">{t("podcastEmpty")}</p>}

      {opened && (
        <div className="lesson-layer" onClick={() => setOpenId(null)}>
          <aside
            className="lesson-inset"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-title"
            aria-describedby="lesson-points"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lesson-inset-head">
              <span className="source-pill">{podcastName(PODCAST_BY_ID[opened.showId], locale)}</span>
              <button ref={closeRef} type="button" className="lesson-close" onClick={() => setOpenId(null)}>
                {t("close")}
              </button>
            </div>
            <h2 id="lesson-title" className={isHebrew(copy(opened).title) ? "he" : "en"}>
              {copy(opened).title}
            </h2>
            <p className="lesson-kicker">{t("lessons")}</p>
            {copy(opened).lessons.length > 0 ? (
              <ol id="lesson-points" className="lesson-list">
                {copy(opened).lessons.map((lesson) => (
                  <li key={lesson} className={isHebrew(lesson) ? "he" : "en"}>
                    {lesson}
                  </li>
                ))}
              </ol>
            ) : (
              <p id="lesson-points" className="lesson-empty">
                {t("lessonsEmpty")}
              </p>
            )}
            <div className="tile-actions">
              <button
                type="button"
                className={`play-ep ${current?.id === opened.id && playing ? "ghost" : ""}`}
                onClick={() => toggle(opened)}
              >
                {current?.id === opened.id && playing ? t("pause") : t("listen")}
              </button>
              <a href={opened.url} target="_blank" rel="noopener noreferrer" className="outbound">
                {t("readOn")} {podcastName(PODCAST_BY_ID[opened.showId], locale)}
              </a>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
