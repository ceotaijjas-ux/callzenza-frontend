/**
 * Comprehensive Timezone and Date formatting utilities for CallZenza.
 * Primary Timezone: Asia/Kolkata (IST, UTC+05:30).
 */

export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Returns today's date formatted as "YYYY-MM-DD" strictly in Asia/Kolkata timezone.
 * Avoids UTC split-date bug near midnight in India.
 */
export function getTodayISTDateString(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Ensures timestamp string is safely parsed as UTC if no offset/Z is provided.
 */
export function parseAsUTC(val?: string | null): Date | null {
  if (!val) return null;
  let str = val.toString().trim();
  if (!str) return null;

  if (str.includes(" ") && !str.includes("T")) {
    str = str.replace(" ", "T");
  }

  // If missing timezone indicator, append Z to ensure standard UTC parsing
  if (!str.endsWith("Z") && !str.includes("+") && !/-\d{2}:\d{2}$/.test(str)) {
    str += "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a timestamp (ISO string or Date) into localized Asia/Kolkata (IST) time string.
 * Example: "09:14 AM"
 */
export function formatISTTime(
  val?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  if (!val) return "—";
  const dateObj = val instanceof Date ? val : parseAsUTC(val);
  if (!dateObj) return "—";

  try {
    return dateObj.toLocaleTimeString("en-US", {
      timeZone: APP_TIMEZONE,
      ...options,
    });
  } catch {
    return dateObj.toLocaleTimeString([], options);
  }
}

/**
 * Formats a timestamp into localized Asia/Kolkata (IST) date string.
 * Example: "Sep 04, 2026"
 */
export function formatISTDate(
  val?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  if (!val) return "—";
  const dateObj = val instanceof Date ? val : parseAsUTC(val);
  if (!dateObj) return "—";

  try {
    return dateObj.toLocaleDateString("en-US", {
      timeZone: APP_TIMEZONE,
      ...options,
    });
  } catch {
    return dateObj.toLocaleDateString([], options);
  }
}

/**
 * Formats a timestamp into localized Asia/Kolkata (IST) date-time string.
 * Example: "9/12/2026, 5:13:51 PM"
 */
export function formatISTDateTime(
  val?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }
): string {
  if (!val) return "—";
  const dateObj = val instanceof Date ? val : parseAsUTC(val);
  if (!dateObj) return "—";

  try {
    return dateObj.toLocaleString("en-US", {
      timeZone: APP_TIMEZONE,
      ...options,
    });
  } catch {
    return dateObj.toLocaleString([], options);
  }
}

/**
 * Default standard date-time formatter across the entire application.
 * Guaranteed to format UTC timestamps accurately to local Indian Standard Time (IST).
 */
export const formatDateTime = formatISTDateTime;
export const formatDate = formatISTDate;
export const formatTime = formatISTTime;

/**
 * Formats call duration in seconds to Minutes & Seconds (mm:ss).
 * e.g., 85 -> "01:25"
 */
export function formatDurationMS(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Formats call duration in seconds to verbal Minutes & Seconds (m s).
 * e.g., 85 -> "1m 25s"
 */
export function formatDurationVerbalMS(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) return "0m 0s";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}m ${secs}s`;
}
