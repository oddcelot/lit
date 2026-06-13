/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import sheetUrl from './hmr-utility-sheet.css?url';
import rawCss from './hmr-utility-sheet.css?raw';

/**
 * A single `CSSStyleSheet` adopted by multiple components — simulates a
 * utility-first framework output (Tailwind, UnoCSS) that's shared across
 * the app. When the utility classes change (new theme colors, spacing
 * scale updates, etc.), `replaceSync()` propagates to all consumers
 * without re-rendering any component.
 *
 * The CSS is loaded through Vite's pipeline (via `?url` + `fetch`), so
 * Lightning CSS transforms apply. The `?raw` import provides a sync
 * initial value to avoid FOUC; the pipeline-processed version replaces
 * it once fetched.
 */
const sheet = new CSSStyleSheet();
sheet.replaceSync(rawCss);

// Upgrade to pipeline-processed CSS when served through Vite's CSS pipeline
fetch(sheetUrl)
  .then((r) => r.text())
  .then((css) => {
    if (css) {
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
      sheet.replaceSync((mod as {default: string}).default);
    }
  });

  // Accept ?url to re-fetch the pipeline-processed CSS after a change.
  import.meta.hot.accept('./hmr-utility-sheet.css?url', () => {
    fetch(`${sheetUrl}?t=${Date.now()}`)
      .then((r) => r.text())
      .then((css) => {
        if (css) {
          sheet.replaceSync(css);
        }
      })
      .catch(() => {});
  });
}
