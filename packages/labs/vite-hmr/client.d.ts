/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Ambient types for the import queries provided by the Lit HMR plugin.
 *
 * Reference via tsconfig (`"types": ["@lit-labs/vite-hmr/client"]`) or
 * `/// <reference types="@lit-labs/vite-hmr/client" />`.
 */

declare module '*.css?blob-url' {
  const href: string;
  export default href;
}
