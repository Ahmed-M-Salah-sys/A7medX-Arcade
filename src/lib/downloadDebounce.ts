/**
 * In-memory debounce tracking for game downloads.
 * Prevents rapid double-clicks, concurrent browser pre-fetching,
 * or duplicate range requests from incrementing the download counter more than once.
 */

const DEBOUNCE_WINDOW_MS = 5000; // 5 seconds window
const downloadTimestamps = new Map<string, number>();

export function shouldIncrementDownload(userId: string, gameSlug: string): boolean {
  const now = Date.now();
  const key = `${(userId || 'anonymous').toLowerCase()}:${(gameSlug || '').toLowerCase()}`;
  const lastTime = downloadTimestamps.get(key);

  // Clean up expired keys periodically
  if (downloadTimestamps.size > 1000) {
    for (const [k, time] of downloadTimestamps.entries()) {
      if (now - time > DEBOUNCE_WINDOW_MS * 2) {
        downloadTimestamps.delete(k);
      }
    }
  }

  if (lastTime && now - lastTime < DEBOUNCE_WINDOW_MS) {
    // Within debounce window: request is served, but counter is not incremented
    return false;
  }

  downloadTimestamps.set(key, now);
  return true;
}

export function resetDownloadDebounce(userId: string, gameSlug: string): void {
  const key = `${(userId || 'anonymous').toLowerCase()}:${(gameSlug || '').toLowerCase()}`;
  downloadTimestamps.delete(key);
}
