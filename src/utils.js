const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

export const ALLOWED_IMAGE_HOSTS = new Set([
  'm.media-amazon.com',
  'static.tvmaze.com',
  'upload.wikimedia.org',
  'covers.openlibrary.org',
]);

export function sanitizeImageUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    if (
      parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      ALLOWED_IMAGE_HOSTS.has(parsed.hostname)
    ) {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export function debounce(fn, delayMs = 200) {
  let timer = null;
  const debounced = (...args) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };
  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}

export async function copyToClipboard(text, fallbackInputEl = null) {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback debajo
    }
  }

  if (fallbackInputEl && typeof document !== 'undefined') {
    try {
      fallbackInputEl.value = text;
      fallbackInputEl.select();
      return Boolean(document.execCommand && document.execCommand('copy'));
    } catch {
      return false;
    }
  }

  return false;
}
