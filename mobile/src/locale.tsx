import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LOCALE_STORAGE_KEY, t, type Locale, type UiKey } from "./gesher";

type LocaleContextValue = {
  locale: Locale;
  rtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: UiKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");

  useEffect(() => {
    void AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((value) => {
      if (value === "en" || value === "he") setLocaleState(value);
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      rtl: locale === "he",
      setLocale: (next) => {
        setLocaleState(next);
        void AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
      },
      t: (key) => t(key, locale),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
