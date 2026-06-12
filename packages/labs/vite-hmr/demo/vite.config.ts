/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {defineConfig} from 'vite';
// Published interim build of this package (@lit-labs/vite-hmr).
import {litHmr} from '@oddsquad/vite-plugin-lit';

export default defineConfig({
  plugins: [litHmr()],
});
