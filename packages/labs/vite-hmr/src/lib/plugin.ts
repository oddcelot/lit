/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import type {CSSOptions, Plugin} from 'vite';
import MagicString from 'magic-string';
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

  /**
   * Inject a small pulsing green dot in the bottom-right corner of the
   * host page that briefly animates on each HMR update. Provides at-a-glance
   * visual feedback without looking at the console. Defaults to `false`.
   */
  updateIndicator?: boolean;
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
 * `import href from './x.css?hmr-url'` — `?url` semantics with working HMR.
 * The string is a real stylesheet URL (dev-served CSS file; hashed `.css`
 * asset on build) for shadow-root `<link>` hrefs and `@import url()`s. In
 * dev, each HMR re-execution yields a freshly cache-busted href, so the
 * browser refetches the changed stylesheet; in build the `?url` asset URL
 * passes through unchanged.
 */
const HMR_URL_QUERY_RE = /^([^?]+\.css)\?(?:[^&]*&)*hmr-url(?:&.*)?$/;
const HMR_URL_PREFIX = '\0lit-hmr:hmr-url:';
// The virtual id must not end in `.css`, or Vite's CSS plugins (which match
// the id's extension regardless of `\0`) would compile the wrapper as CSS.
const HMR_URL_SUFFIX = '.js';

/**
 * Import-query support, served in dev and build alike (source code using
 * `?hmr-url` must keep working under `vite build`, where the HMR plugin
 * doesn't apply). Exported for the baseline e2e run, which needs the query
 * working without the HMR plugin.
 */
export const litCssQueries = (): Plugin => ({
  name: 'lit-hmr-css-query',
  // Vite's core resolver claims `./x.css?hmr-url` for the CSS pipeline
  // before normal plugins get a look, so resolve ahead of it.
  enforce: 'pre',
  async resolveId(id, importer) {
    const match = HMR_URL_QUERY_RE.exec(id);
    if (match === null) {
      return null;
    }
    const resolved = await this.resolve(match[1], importer);
    if (resolved === null) {
      return null;
    }
    return HMR_URL_PREFIX + resolved.id + HMR_URL_SUFFIX;
  },
  load(id) {
    if (!id.startsWith(HMR_URL_PREFIX)) {
      return null;
    }
    const file = id.slice(HMR_URL_PREFIX.length, -HMR_URL_SUFFIX.length);
    const helperPath = resolveRuntimeModule('css');
    return (
      `import url from ${JSON.stringify(`${file}?url`)};\n` +
      `import {devCacheBust} from ${JSON.stringify(helperPath)};\n` +
      `export default devCacheBust(url);\n`
    );
  },
});

/**
 * A `css` tagged template literal with no interpolations and no escape
 * sequences — the only kind we can hand to a CSS parser as-is. Literals
 * with `${…}` holes or backslashes simply don't match and stay untouched.
 * The lookbehind keeps `unsafeCSS`/`myCss`-style tags from matching.
 */
const CSS_LITERAL_RE = /(?<![\w$.])css`((?:[^`\\$]|\$(?!\{))*)`/g;

/**
 * Runs Vite's configured Lightning CSS over `css` tagged template literals
 * in user modules, which the CSS pipeline itself never sees (they're plain
 * JS strings to it). Inert unless `css.transformer` is `'lightningcss'`;
 * options come from `css.lightningcss`, so component styles get the same
 * treatment (targets, drafts, …) as `.css` files. Applies in dev and build.
 */
const litCssLiterals = (): Plugin => {
  let lightningcss: typeof import('lightningcss') | null = null;
  let options: CSSOptions['lightningcss'];
  let minify = false;
  return {
    name: 'lit-hmr-css-literals',
    async configResolved(config) {
      if (config.css.transformer !== 'lightningcss') {
        return;
      }
      // The transformer setting guarantees the dependency: Vite itself
      // can't process .css files without it.
      lightningcss = await import('lightningcss');
      // cssModules makes no sense for a literal; everything else carries
      // over.
      const {cssModules: _cssModules, ...rest} = config.css.lightningcss ?? {};
      options = rest;
      minify = config.command === 'build';
    },
    transform(code, id) {
      if (lightningcss === null) {
        return null;
      }
      if (id.startsWith('\0') || id.includes('/node_modules/')) {
        return null;
      }
      const [file] = id.split('?', 2);
      if (!JS_FILE_RE.test(file) || !code.includes('css`')) {
        return null;
      }
      const ms = new MagicString(code);
      let changed = false;
      for (const m of code.matchAll(CSS_LITERAL_RE)) {
        const literal = m[1];
        if (literal.trim() === '') {
          continue;
        }
        let out: string;
        try {
          const result = lightningcss.transform({
            ...options,
            filename: file,
            code: Buffer.from(literal),
            minify,
          });
          out = Buffer.from(result.code).toString();
        } catch (e) {
          this.warn(
            `[lit-hmr] skipping css literal Lightning CSS couldn't parse: ${
              (e as Error).message
            }`
          );
          continue;
        }
        // Re-escape for the template literal the output goes back into.
        out = out.replace(/[\\`$]/g, '\\$&');
        if (out !== literal) {
          const start = m.index + 'css`'.length;
          ms.overwrite(start, start + literal.length, out);
          changed = true;
        }
      }
      if (!changed) {
        return null;
      }
      return {code: ms.toString(), map: ms.generateMap({hires: true})};
    },
  };
};

/**
 * Vite plugin set providing true HMR for Lit: template-strings interning
 * plus in-place custom element class patching (dev-only), the `?hmr-url`
 * CSS import query (dev and build), and Lightning CSS processing of `css`
 * tagged template literals when `css.transformer` is `'lightningcss'`.
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
    transformIndexHtml() {
      if (!options.updateIndicator) {
        return;
      }
      return [
        {
          tag: 'style',
          children: `@keyframes __lhmr_p{0%{transform:scale(1);opacity:.3}20%{transform:scale(2);opacity:1}100%{transform:scale(1);opacity:.2}}#__lhmr_d{position:fixed;bottom:16px;right:16px;width:12px;height:12px;border-radius:50%;background:#22c55e;z-index:2147483647;pointer-events:none;opacity:.2}#__lhmr_d.__lhmr_a{animation:__lhmr_p 2s ease-out forwards}`,
          injectTo: 'head-prepend',
        },
        {
          tag: 'div',
          attrs: {id: '__lhmr_d'},
          injectTo: 'body',
        },
        {
          tag: 'script',
          attrs: {type: 'module'},
          children: `const d=document.getElementById('__lhmr_d');import.meta.hot?.on('vite:afterUpdate',()=>{d.classList.remove('__lhmr_a');void d.offsetWidth;d.classList.add('__lhmr_a')});`,
          injectTo: 'body',
        },
      ];
    },
  };
  return [litCssQueries(), litCssLiterals(), hmr];
};
