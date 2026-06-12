/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Browser helpers for referencing CSS files from shadow roots via Vite's
 * `?url` imports.
 *
 * A `?url` import yields a real stylesheet URL — the dev server serves the
 * file as CSS, and `vite build` emits it as a hashed `.css` asset. That
 * makes it the right base for `<link>` hrefs and `@import url()`s inside
 * shadow roots. The one gap is dev HMR: the imported URL string is identical
 * across module re-executions, so the browser would keep the stale
 * stylesheet. These helpers close that gap.
 *
 * This module is dependency-free and must stay safe to load in any
 * environment.
 */

/**
 * Appends a cache-busting query to a `?url`-imported CSS file URL in dev.
 *
 * Call this at *module scope* (not in `render()`, where every render would
 * refetch): each HMR re-execution then yields a fresh href and the browser
 * refetches the changed stylesheet.
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
 * html`<link rel="stylesheet" href="${href}" />`;
 * ```
 */
export const devCacheBust = (url: string): string => {
  const env = (import.meta as {env?: {DEV?: boolean}}).env;
  return env?.DEV ? `${url}?t=${Date.now()}` : url;
};
