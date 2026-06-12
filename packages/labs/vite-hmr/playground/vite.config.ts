/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {defineConfig} from 'vite';
// Built package output; `npm run dev` (wireit) builds it first.
import {litHmr} from '../index.js';

export default defineConfig({
  server: {
    port: 5179,
    strictPort: true,
  },
  plugins: [litHmr()],
});
