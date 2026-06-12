/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import type {Plugin} from 'vite';
import {INSTALL_ID, VIRTUAL_PREFIX, transformLitModule} from './transform.js';
import {WRAP_TABLE} from './wrap-table.js';

/**
 * Options for the Lit HMR Vite plugin.
 */
export interface LitHmrOptions {
  /**
   * Cycle `disconnectedCallback()`/`connectedCallback()` on live instances
   * after a hot patch. Interning makes this mostly unnecessary, so it's
   * opt-in. Defaults to `false`.
   */
  reconnect?: boolean;

  /**
   * What to do when a component can't be hot-patched in place (e.g.
   * standard `accessor` decorators). Defaults to `'reload'`.
   */
  onIncompatible?: 'reload' | 'warn';
}

/**
 * Resolves a runtime module to an absolute fs path (served via `/@fs/`), so
 * the plugin works from any served root. Falls back from the built `.js` to
 * the `.ts` source when running un-built (e.g. under vitest).
 */
const resolveRuntimeModule = (name: string): string => {
  for (const ext of ['js', 'ts'] as const) {
    const url = new URL(`./runtime/${name}.${ext}`, import.meta.url);
    if (existsSync(url)) {
      return fileURLToPath(url).replace(/\\/g, '/');
    }
  }
  throw new Error(`[lit-hmr] runtime module not found: ${name}`);
};

const JS_FILE_RE = /\.[cm]?[jt]sx?$/;

/**
 * `import href from './x.css?blob-url'` — yields a string URL serving the
 * file's CSS, backed by the memoized `cssBlobUrl` runtime helper, so a
 * shadow-root `<link>` href or `@import url()` can use it directly and HMR
 * yields a fresh URL per re-execution.
 */
const BLOB_URL_QUERY_RE = /^([^?]+\.css)\?(?:[^&]*&)*blob-url(?:&.*)?$/;
const BLOB_URL_PREFIX = '\0lit-hmr:blob-url:';
// The virtual id must not end in `.css`, or Vite's CSS plugins (which match
// the id's extension regardless of `\0`) would compile the wrapper as CSS.
const BLOB_URL_SUFFIX = '.js';

/**
 * Import-query support, served in dev and build alike (source code using
 * `?blob-url` must keep working under `vite build`, where the HMR plugin
 * doesn't apply). Exported for the baseline e2e run, which needs the query
 * working without the HMR plugin.
 */
export const litCssQueries = (): Plugin => ({
  name: 'lit-hmr-css-query',
  // Vite's core resolver claims `./x.css?blob-url` for the CSS pipeline
  // before normal plugins get a look, so resolve ahead of it.
  enforce: 'pre',
  async resolveId(id, importer) {
    const match = BLOB_URL_QUERY_RE.exec(id);
    if (match === null) {
      return null;
    }
    const resolved = await this.resolve(match[1], importer);
    if (resolved === null) {
      return null;
    }
    return BLOB_URL_PREFIX + resolved.id + BLOB_URL_SUFFIX;
  },
  load(id) {
    if (!id.startsWith(BLOB_URL_PREFIX)) {
      return null;
    }
    const file = id.slice(BLOB_URL_PREFIX.length, -BLOB_URL_SUFFIX.length);
    const helperPath = resolveRuntimeModule('css');
    return (
      `import cssText from ${JSON.stringify(`${file}?inline`)};\n` +
      `import {cssBlobUrl} from ${JSON.stringify(helperPath)};\n` +
      `export default cssBlobUrl(cssText);\n`
    );
  },
});

/**
 * Vite plugin set providing true HMR for Lit: template-strings interning
 * plus in-place custom element class patching (dev-only), and the
 * `?blob-url` CSS import query (dev and build).
 */
export const litHmr = (options: LitHmrOptions = {}): Plugin[] => {
  const runtimeOptions = {
    reconnect: options.reconnect ?? false,
    onIncompatible: options.onIncompatible ?? 'reload',
  };
  const hmr: Plugin = {
    name: 'lit-hmr',
    apply: 'serve',
    // The injected runtime imports are invisible to the dep scanner. The
    // lit family stays prebundle-eligible on purpose: the wrapper modules'
    // bare imports then resolve to the same URL every other importer gets —
    // single lit instance, single template cache.
    config: () => ({
      optimizeDeps: {exclude: ['@lit-labs/vite-hmr']},
    }),
    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return id;
      }
      // Resolve the browser CSS helpers to the copy shipped next to this
      // plugin, so they work even when the package isn't reachable through
      // node resolution from the served root (and stay out of prebundling).
      if (id === '@lit-labs/vite-hmr/css.js') {
        return resolveRuntimeModule('css');
      }
      return null;
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) {
        return null;
      }
      if (id === INSTALL_ID) {
        const patchPath = resolveRuntimeModule('patch');
        return (
          `import {install} from ${JSON.stringify(patchPath)};\n` +
          `install(${JSON.stringify(runtimeOptions)});\n`
        );
      }
      const spec = id.slice(VIRTUAL_PREFIX.length);
      const wrappedTags = WRAP_TABLE.get(spec);
      if (wrappedTags === undefined) {
        return null;
      }
      const internPath = resolveRuntimeModule('intern');
      // Browser-native ESM: explicit local exports shadow `export *` names
      // (spec-guaranteed), so everything except the wrapped tags passes
      // through unchanged.
      const lines = [
        `import * as __lit from ${JSON.stringify(spec)};`,
        `import {wrapTag} from ${JSON.stringify(internPath)};`,
        `export * from ${JSON.stringify(spec)};`,
      ];
      for (const {exportName, ns} of wrappedTags) {
        lines.push(
          `export const ${exportName} = wrapTag(__lit.${exportName}, ${JSON.stringify(
            ns
          )});`
        );
      }
      return lines.join('\n') + '\n';
    },
    async transform(code, id, transformOptions) {
      if (transformOptions?.ssr) {
        return null;
      }
      if (id.startsWith('\0') || id.includes('/node_modules/')) {
        return null;
      }
      const [file] = id.split('?', 2);
      // Allow inline scripts extracted from HTML (`?html-proxy`).
      if (!JS_FILE_RE.test(file) && !id.includes('?html-proxy')) {
        return null;
      }
      return transformLitModule(code);
    },
  };
  return [litCssQueries(), hmr];
};
