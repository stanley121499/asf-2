/**
 * Compact relative time string for notification rows (Chinese).
 */
export function formatRelativeTimeZh(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return "";
  }
  const diffMs = Date.now() - t;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) {
    return "刚刚";
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} 分钟前`;
  }
  const h = Math.floor(min / 60);
  if (h < 24) {
    return `${h} 小时前`;
  }
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}
