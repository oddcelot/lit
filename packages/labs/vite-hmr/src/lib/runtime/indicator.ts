/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Runtime module for the HMR update indicator injected by the plugin.
 * Served as an external module so that `import.meta.hot` is available.
 * The HTML element and optional count span are created by the plugin's
 * `transformIndexHtml` hook — this module only drives the animation.
 */

const dot = document.getElementById('__lhmr_d')!;
const count: HTMLElement | null = document.querySelector('.__lhmr_c');
let n = 0;

(import.meta as {hot?: {on: (event: string, cb: () => void) => void}}).hot?.on(
  'vite:afterUpdate',
  () => {
    if (count !== null) {
      count.textContent = String(++n);
    }
    dot.classList.remove('__lhmr_a');
    void dot.offsetWidth;
    dot.classList.add('__lhmr_a');
  }
);
