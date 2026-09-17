"use client";

import { useEffect, useState } from "react";
import { APP_TIMEZONE } from "./date-utils";

export function useLiveClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  const timeWithSecondsStr = now.toLocaleTimeString("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateStr = now.toLocaleDateString("en-GB", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const longDateStr = now.toLocaleDateString("en-US", {
    timeZone: APP_TIMEZONE,
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  const currentHourStart = new Date(now);
  currentHourStart.setMinutes(0, 0, 0);
  const currentHourEnd = new Date(currentHourStart.getTime() + 60 * 60 * 1000);

  const currentHourWindow = `${currentHourStart.toLocaleTimeString("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  })} - ${currentHourEnd.toLocaleTimeString("en-US", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  return {
    mounted,
    now,
    timeStr,
    timeWithSecondsStr,
    dateStr,
    longDateStr,
    currentHourWindow,
    reportTimestamp: `${dateStr} · ${timeStr}`,
    reportTimestampLong: `${longDateStr} · ${timeStr}`,
  };
}
