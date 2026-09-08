"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IsraelClock } from "./IsraelClock";
import { LanguageToggle } from "./LanguageToggle";
import { useLocale } from "./LocaleProvider";

const LINKS = [
  { href: "/", key: "navHeadlines" as const },
  { href: "/podcasts", key: "navPodcasts" as const },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Masthead() {
  const { t } = useLocale();
  const pathname = usePathname() ?? "/";

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <Link href="/" className="brand-lockup">
          <span className="brand-text">
            <strong className="wordmark">גשר</strong>
            <span className="brand-tag">{t("tagline")}</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label={t("navAria")}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(pathname, link.href) ? "active" : undefined}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <div className="masthead-tools">
          <LanguageToggle />
          <IsraelClock />
        </div>
      </div>
    </header>
  );
}
