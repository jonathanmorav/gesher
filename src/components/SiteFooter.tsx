"use client";

import { PODCASTS, podcastName } from "@/lib/podcasts";
import { SOURCES, sourceName } from "@/lib/sources";
import { useLocale } from "./LocaleProvider";

export type FooterKind = "news" | "podcasts";

export function SiteFooter({ kind = "news" }: { kind?: FooterKind }) {
  const { locale, t } = useLocale();

  if (kind === "podcasts") {
    return (
      <footer className="colophon">
        <p>{t("podcastsColophon")}</p>
        <p className="sources-line">
          {t("shows")}:{" "}
          {PODCASTS.map((show, index) => (
            <span key={show.id}>
              {index > 0 && " · "}
              <a href={show.homepage} target="_blank" rel="noopener noreferrer">
                {podcastName(show, locale)}
              </a>
            </span>
          ))}
        </p>
      </footer>
    );
  }

  return (
    <footer className="colophon">
      <p>{t("colophon")}</p>
      <p className="sources-line">
        {t("sources")}:{" "}
        {SOURCES.map((source, index) => (
          <span key={source.id}>
            {index > 0 && " · "}
            <a href={source.homepage} target="_blank" rel="noopener noreferrer">
              {sourceName(source, locale)}
            </a>
          </span>
        ))}
      </p>
    </footer>
  );
}
