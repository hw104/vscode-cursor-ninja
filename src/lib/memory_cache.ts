const cache = new Map<string, any>();
const maxCacheSize = 100;

export async function useCacheAsync<T>(key: string, fn: () => Promise<T>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  if (cache.size >= maxCacheSize) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey != null) {
      cache.delete(oldestKey);
    }
  }
  const value = await fn();
  cache.set(key, value);
  return value;
}
