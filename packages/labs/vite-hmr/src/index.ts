/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Options for the Lit HMR Vite plugin.
 */
export interface LitHmrOptions {
  /**
   * Cycle `disconnectedCallback()`/`connectedCallback()` on live instances
   * after a hot patch. Defaults to `false`.
   */
  reconnect?: boolean;

  /**
   * What to do when a component can't be hot-patched in place (e.g. standard
   * `accessor` decorators). Defaults to `'reload'`.
   */
  onIncompatible?: 'reload' | 'warn';
}
