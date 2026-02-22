/**
 * Lightweight lucide-react stub used during tests via resolve alias.
 *
 * Purpose: Prevent Vite from transforming the real lucide-react package
 * (41 MB on disk → ~2-3 GB in V8 memory) which causes OOM in CI forks.
 * This stub is resolved at the Vite/resolve level, so the real package
 * is never loaded or transformed.
 *
 * Every named export returns a no-op React component (() => null).
 * Uses a Proxy so we never need to manually list icon names.
 */
const noop = () => null;

// Proxy-based: any named import resolves to noop.
// 'then' returns undefined to prevent vitest from treating this as a Promise.
module.exports = new Proxy(
  { __esModule: true, default: noop },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'then') return undefined;
      if (typeof prop === 'symbol') return undefined;
      return noop;
    },
    has() {
      return true;
    },
  }
);
