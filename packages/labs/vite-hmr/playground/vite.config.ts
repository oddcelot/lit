/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {defineConfig} from 'vite';

export default defineConfig(async () => {
  // Inside the monorepo, use the built package output (`npm run dev` via
  // wireit builds it first). When the playground is opened standalone —
  // e.g. imported into StackBlitz/bolt.new from the repo URL — the parent
  // package isn't there, so fall back to the published plugin.
  // The indirection keeps the config bundler from trying (and warning
  // about failing) to resolve the fallback inside the monorepo.
  const fallback = '@oddsquad/vite-plugin-lit';
  const {litHmr} = await import('../index.js').catch(
    () => import(/* @vite-ignore */ fallback)
  );
  return {
    server: {
      port: 5179,
      strictPort: true,
    },
    plugins: [litHmr()],
  };
});
