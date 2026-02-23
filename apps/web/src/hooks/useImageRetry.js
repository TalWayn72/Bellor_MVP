/**
 * useImageRetry - Auto-retry failed image loads with cache-busting
 * Retries up to MAX_RETRIES times before marking as broken.
 * Broken images can be manually retried via retryImage().
 */

import { useState, useCallback } from 'react';

const MAX_RETRIES = 2;

export function useImageRetry() {
  const [brokenImages, setBrokenImages] = useState(new Set());
  const [retryCounts, setRetryCounts] = useState({});

  const handleImageError = useCallback((url) => {
    setRetryCounts(prev => {
      const count = (prev[url] || 0) + 1;
      if (count > MAX_RETRIES) {
        setBrokenImages(p => new Set(p).add(url));
        return prev;
      }
      return { ...prev, [url]: count };
    });
  }, []);

  const retryImage = useCallback((url) => {
    setBrokenImages(prev => { const next = new Set(prev); next.delete(url); return next; });
    setRetryCounts(prev => { const next = { ...prev }; delete next[url]; return next; });
  }, []);

  const clearAll = useCallback(() => {
    setBrokenImages(new Set());
    setRetryCounts({});
  }, []);

  const getRetrySrc = useCallback((url) => {
    const r = retryCounts[url];
    return r ? `${url}${url.includes('?') ? '&' : '?'}r=${r}` : url;
  }, [retryCounts]);

  const isBroken = useCallback((url) => brokenImages.has(url), [brokenImages]);

  return { handleImageError, retryImage, clearAll, getRetrySrc, isBroken };
}
