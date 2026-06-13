/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import rawCss from './hmr-utility-sheet.css?raw';
import cssHref from './hmr-utility-sheet.css?hmr-url';

/**
 * A single `CSSStyleSheet` adopted by multiple components — simulates a
 * utility-first framework output (Tailwind, UnoCSS) that's shared across
 * the app. When the utility classes change (new theme colors, spacing
 * scale updates, etc.), `replaceSync()` propagates to all consumers
 * without re-rendering any component.
 *
 * The CSS is loaded through Vite's pipeline (via `?hmr-url` + `fetch`),
 * so Lightning CSS transforms apply. The `?raw` import provides a sync
 * initial value to avoid FOUC; the pipeline-processed version replaces
 * it once fetched.
 */
const sheet = new CSSStyleSheet();
let currentRaw = rawCss;
sheet.replaceSync(currentRaw);

// Upgrade to pipeline-processed CSS on first idle opportunity
fetch(cssHref)
  .then((r) => r.text())
  .then((css) => {
    if (css) {
      currentRaw = css;
      sheet.replaceSync(css);
    }
  })
  .catch(() => {});

export default sheet;

if (import.meta.hot) {
  // Accept ?raw to prevent HMR from bubbling to component modules and
  // provide an instant (unprocessed) update while the fetch is in flight.
  import.meta.hot.accept(['./hmr-utility-sheet.css?raw'], ([mod]) => {
    if (mod) {
      currentRaw = (mod as {default: string}).default;
      sheet.replaceSync(currentRaw);
    }
  });

  // Accept ?hmr-url to get a fresh URL to the pipeline-processed CSS.
  import.meta.hot.accept('./hmr-utility-sheet.css?hmr-url', (mod) => {
    const href = (mod as {default: string}).default;
    fetch(href)
      .then((r) => r.text())
      .then((css) => {
        if (css) {
          sheet.replaceSync(css);
        }
      })
      .catch(() => {});
  });
}
