export function isDocumentActive() {
  if (typeof document === 'undefined') return true;
  if (document.visibilityState && document.visibilityState !== 'visible') return false;
  if (typeof document.hasFocus === 'function') return document.hasFocus() !== false;
  return true;
}
