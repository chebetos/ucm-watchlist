import { describe, expect, test } from 'bun:test';
import { escapeHtml, sanitizeImageUrl, debounce } from '../src/utils.js';

describe('escapeHtml', () => {
  test('escapa caracteres peligrosos de HTML y XSS', () => {
    const payload = `<img src="x" onerror='alert("xss")'> & test`;
    expect(escapeHtml(payload)).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#39;alert(&quot;xss&quot;)&#39;&gt; &amp; test'
    );
  });

  test('maneja valores no-string sin lanzar TypeError', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml({ a: 1 })).toBe('[object Object]');
  });
});

describe('sanitizeImageUrl', () => {
  test('acepta URLs https válidas de hosts permitidos', () => {
    expect(sanitizeImageUrl('https://static.tvmaze.com/uploads/images/medium_landscape/1/123.jpg')).toBe(
      'https://static.tvmaze.com/uploads/images/medium_landscape/1/123.jpg'
    );
    expect(sanitizeImageUrl('https://m.media-amazon.com/images/poster.jpg')).toBe(
      'https://m.media-amazon.com/images/poster.jpg'
    );
    expect(sanitizeImageUrl('https://upload.wikimedia.org/wikipedia/en/poster.jpg')).toBe(
      'https://upload.wikimedia.org/wikipedia/en/poster.jpg'
    );
    expect(sanitizeImageUrl('https://covers.openlibrary.org/b/isbn/123-M.jpg')).toBe(
      'https://covers.openlibrary.org/b/isbn/123-M.jpg'
    );
  });

  test('rechaza esquemas inseguros, hosts no permitidos, credenciales embebidas o URLs inválidas', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeImageUrl('http://static.tvmaze.com/a.jpg')).toBeNull();
    expect(sanitizeImageUrl('https://evil.example.com/tracker.png')).toBeNull();
    expect(sanitizeImageUrl('https://user:pass@static.tvmaze.com/a.jpg')).toBeNull();
    expect(sanitizeImageUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeImageUrl('')).toBeNull();
    expect(sanitizeImageUrl(null)).toBeNull();
    expect(sanitizeImageUrl('not-a-url')).toBeNull();
  });
});

describe('debounce', () => {
  test('agrupa múltiples llamadas rápidas en una sola ejecución', async () => {
    let calls = 0;
    const fn = debounce(() => {
      calls++;
    }, 30);

    fn();
    fn();
    fn();
    expect(calls).toBe(0);

    await new Promise((r) => setTimeout(r, 60));
    expect(calls).toBe(1);
  });
});
