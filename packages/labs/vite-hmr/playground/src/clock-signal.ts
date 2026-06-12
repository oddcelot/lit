/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {signal} from '@lit-labs/signals';

/**
 * Current time as a shared signal, ticking once a second. Lives in its own
 * non-component module so component edits never re-execute it — the clock
 * keeps ticking through hot patches. If this module itself is edited, the
 * dispose hook clears the stale interval before re-execution.
 */
export const now = signal(new Date());

const interval = setInterval(() => {
  now.set(new Date());
}, 1000);

import.meta.hot?.dispose(() => clearInterval(interval));
