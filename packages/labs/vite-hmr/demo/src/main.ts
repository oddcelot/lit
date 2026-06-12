/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import './demo-counter.js';
import './demo-input.js';
import './demo-styled.js';

if (import.meta.hot) {
  let updates = 0;
  import.meta.hot.on('vite:afterUpdate', () => {
    updates++;
    document.getElementById('hmr-updates')!.textContent = String(updates);
  });
}
