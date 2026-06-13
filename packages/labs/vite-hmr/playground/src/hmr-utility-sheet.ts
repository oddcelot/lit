/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import rawCss from './hmr-utility-sheet.css?raw';

/**
 * A single `CSSStyleSheet` adopted by multiple components — simulates a
 * utility-first framework output (Tailwind, UnoCSS) that's shared across
 * the app. When the utility classes change (new theme colors, spacing
 * scale updates, etc.), `replaceSync()` propagates to all consumers
 * without re-rendering any component.
 */
const sheet = new CSSStyleSheet();
sheet.replaceSync(rawCss);

export default sheet;

if (import.meta.hot) {
  import.meta.hot.accept(['./hmr-utility-sheet.css?raw'], ([mod]) => {
    if (mod) {
      sheet.replaceSync((mod as {default: string}).default);
    }
  });
}
