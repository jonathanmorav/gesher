"use client";

import { useLocale } from "./LocaleProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="lang-toggle" role="group" aria-label={t("language")}>
      <button type="button" className={locale === "he" ? "active" : ""} onClick={() => setLocale("he")}>
        עב
      </button>
      <button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>
        EN
      </button>
    </div>
  );
}
