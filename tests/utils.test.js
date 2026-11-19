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
  test('acepta URLs https válidas', () => {
    expect(sanitizeImageUrl('https://static.tvmaze.com/uploads/images/medium_landscape/1/123.jpg')).toBe(
      'https://static.tvmaze.com/uploads/images/medium_landscape/1/123.jpg'
    );
  });

  test('rechaza esquemas inseguros o URLs inválidas', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeImageUrl('http://insecure.example.com/a.jpg')).toBeNull();
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
