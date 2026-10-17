export type TimeCategory = "Bullet" | "Blitz" | "Rapid" | "Classical";

export function getTimeCategory(baseMinutes: number, incrementSeconds: number): TimeCategory {
  const totalMinutes = baseMinutes + (incrementSeconds * 40) / 60;
  if (totalMinutes < 3) return "Bullet";
  if (totalMinutes < 10) return "Blitz";
  if (totalMinutes < 60) return "Rapid";
  return "Classical";
}

export function isValidTimeControl(baseMinutes: number, incrementSeconds: number): boolean {
  return (
    Number.isInteger(baseMinutes) &&
    baseMinutes >= 1 &&
    baseMinutes <= 60 &&
    Number.isInteger(incrementSeconds) &&
    incrementSeconds >= 0 &&
    incrementSeconds <= 30
  );
}

/**
 * Formats remaining time in milliseconds for turn timers and chess clock displays.
 * Below 10 seconds (< 10000ms), displays decimal tenths of a second ("0:0S.T", e.g. "0:08.4").
 * At or above 10 seconds, displays standard MM:SS ("0:10", "1:05", "60:00").
 * Negative values and non-finite numbers are safely clamped to zero ("0:00.0").
 */
export function formatTime(totalMs: number): string {
  const safeMs = Math.max(0, Number.isFinite(totalMs) ? totalMs : 0);
  if (safeMs < 10000) {
    const s = Math.floor(safeMs / 1000);
    const tenths = Math.floor((safeMs % 1000) / 100);
    return `0:0${s}.${tenths}`;
  }
  const totalSeconds = Math.floor(safeMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

