"use client";

import { useEffect, useState } from "react";
import { formatIsraelClock } from "@/lib/time";
import { useLocale } from "./LocaleProvider";

export function IsraelClock() {
  const { locale } = useLocale();
  const [clock, setClock] = useState<ReturnType<typeof formatIsraelClock> | null>(null);

  useEffect(() => {
    const tick = () => setClock(formatIsraelClock(new Date(), locale));
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [locale]);

  return (
    <div className="clock">
      <span className="clock-date">{clock?.date ?? "\u00a0"}</span>
      <span className="clock-time">{clock?.time ?? "\u00a0"}</span>
    </div>
  );
}
