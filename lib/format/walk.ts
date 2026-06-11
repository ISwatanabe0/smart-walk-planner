/** メートルを「1.2km」「850m」のように人間向けに整形する */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)}km`;
  }
  return `${Math.round(meters)}m`;
}

/** 秒数を「mm:ss」または「h:mm:ss」形式に整形する */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/** 歩行距離と経過時間から平均ペース（分/km）を整形する。距離が短すぎる場合は null */
export function formatPace(meters: number, seconds: number): string | null {
  if (meters < 50 || seconds <= 0) {
    return null;
  }
  const minutesPerKm = seconds / 60 / (meters / 1000);
  const paceMinutes = Math.floor(minutesPerKm);
  const paceSeconds = Math.round((minutesPerKm - paceMinutes) * 60);
  const ss = String(paceSeconds).padStart(2, "0");
  return `${paceMinutes}'${ss}"/km`;
}
