/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Browser helpers for loading CSS into shadow roots from Vite CSS imports.
 *
 * Vite serves plain `.css` imports as JavaScript modules, so `<link>` hrefs
 * and `@import url()`s inside a shadow root can't point at them directly.
 * These helpers bridge the gap from the import forms Vite does offer
 * (`?inline` strings and `?url` file URLs) to URLs a shadow root can load,
 * while keeping HMR working: an edit to the CSS file re-executes the
 * importing component module, and these helpers make sure that re-execution
 * yields a *new* URL so the browser refetches.
 *
 * This module is dependency-free and must stay safe to load in any
 * environment.
 *
 * @example
 * ```ts
 * import cssText from './my-element.css?inline';
 * import {cssBlobUrl} from '@lit-labs/vite-hmr/css.js';
 *
 * // In render():
 * html`<link rel="stylesheet" href="${cssBlobUrl(cssText)}" />`;
 * ```
 */

// One URL per distinct CSS text, even if this module is loaded twice
// (e.g. via both an optimized and a raw URL).
const CACHE_KEY = Symbol.for('@lit-labs/vite-hmr#cssUrls');

const getCache = (): Map<string, string> => {
  const g = globalThis as unknown as Record<
    symbol,
    Map<string, string> | undefined
  >;
  return (g[CACHE_KEY] ??= new Map());
};

/**
 * Returns an object URL serving the given CSS text, suitable for a `<link>`
 * href or `@import url()` inside a shadow root.
 *
 * URLs are memoized by content, so calling this in `render()` is fine:
 * unchanged text (re-renders, multiple instances) reuses one URL, while the
 * new text after an HMR update maps to a fresh URL and the browser refetches.
 */
export const cssBlobUrl = (cssText: string): string => {
  const cache = getCache();
  let url = cache.get(cssText);
  if (url === undefined) {
    url = URL.createObjectURL(new Blob([cssText], {type: 'text/css'}));
    cache.set(cssText, url);
  }
  return url;
};

/**
 * Appends a cache-busting query to a `?url`-imported CSS file URL in dev.
 *
 * The URL string a `?url` import yields is identical across HMR
 * re-executions, so the browser would keep the stale stylesheet. Call this
 * at *module scope* (not in `render()`, where every render would refetch)
 * to give each module execution a fresh href.
 *
 * In production builds the URL is a content-hashed asset, so the input is
 * returned unchanged.
 *
 * @example
 * ```ts
 * import cssUrl from './my-element.css?url';
 * import {devCacheBust} from '@lit-labs/vite-hmr/css.js';
 *
 * const href = devCacheBust(cssUrl); // module scope
 * ```
 */
export const devCacheBust = (url: string): string => {
  const env = (import.meta as {env?: {DEV?: boolean}}).env;
  return env?.DEV ? `${url}?t=${Date.now()}` : url;
};
