/** 读取 hash 路由中的查询参数，例如 #/products?page=2&search=灯 */
export function readRouteQuery(path: string) {
  return new URLSearchParams(path.split('?')[1] || '');
}

/**
 * 只更新 hash 的查询参数，不触发 hashchange，避免列表翻页时整页重新应用路由。
 * 空字符串、null、undefined、false 会删除对应键。
 */
export function updateRouteQuery(patch: Record<string, string | number | boolean | null | undefined>) {
  const raw = window.location.hash.slice(1) || '/overview';
  const [pathname, search] = raw.split('?');
  const params = new URLSearchParams(search || '');
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '' || value === false) params.delete(key);
    else params.set(key, String(value));
  }
  const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
  if (`#${next}` !== window.location.hash) window.history.replaceState(null, '', `#${next}`);
}

export function queryPage(value: string | null, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function queryPageSize(value: string | null, fallback = 30) {
  const parsed = Number(value);
  return [20, 30, 50, 100].includes(parsed) ? parsed : fallback;
}
