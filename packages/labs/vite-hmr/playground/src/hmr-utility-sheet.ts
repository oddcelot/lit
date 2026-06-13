/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import sheetUrl from './hmr-utility-sheet.css?url';

/**
 * A single `CSSStyleSheet` adopted by multiple components — simulates a
 * utility-first framework output (Tailwind, UnoCSS) shared across the app.
 * When the utility classes change (new theme color, spacing scale, …),
 * `replaceSync()` propagates to every adopter without re-rendering a single
 * component, and without a full-page reload.
 *
 * Unlike the `?inline`/`?raw` shared-sheet demos (which bake the CSS into the
 * JS bundle), `?url` keeps the stylesheet as a *standalone, pipeline-processed
 * `.css` asset* in the build output and loads it into the constructed sheet
 * at runtime via `fetch()`. That's the one way to have both a real `.css`
 * file on disk and a sheet shared across shadow roots.
 *
 * Reading the asset back differs by mode:
 * - build: `sheetUrl` is the hashed `.css` asset; fetch it as-is.
 * - dev:   `?url` resolves to a path the dev server serves as a JS module
 *          (`__vite__updateStyle(…)`), so a plain fetch would get JavaScript.
 *          The `direct` query makes Vite return the compiled CSS bytes
 *          (`text/css`) instead — pipeline-processed, same as build.
 *
 * Trade-off vs `?inline`: the sheet is empty until the first fetch resolves,
 * so there's a brief flash of unstyled content on initial load. In exchange,
 * the CSS ships as a cacheable file rather than inside the JS chunk.
 */
const sheet = new CSSStyleSheet();

export default sheet;

const cssHref = (url: string): string =>
  import.meta.env.DEV ? `${url}${url.includes('?') ? '&' : '?'}direct` : url;

const load = (url: string): Promise<void> =>
  fetch(cssHref(url))
    .then((r) => r.text())
    .then((css) => sheet.replaceSync(css))
    .catch(() => {});

load(sheetUrl);

if (import.meta.hot) {
  // Self-accept the `?url` dependency: HMR stops here and never bubbles to
  // the component modules that adopt this sheet, so they don't re-render.
  // Each edit yields a freshly cache-busted `sheetUrl`; re-fetching it and
  // calling `replaceSync()` updates every shadow root in place — no reload.
  import.meta.hot.accept('./hmr-utility-sheet.css?url', (mod) => {
    if (mod) {
      load((mod as {default: string}).default);
    }
  });
}
