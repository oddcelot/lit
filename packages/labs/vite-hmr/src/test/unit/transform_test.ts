/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {describe, expect, test} from 'vitest';
import {
  INSTALL_ID,
  VIRTUAL_PREFIX,
  isComponentModule,
  transformLitModule,
} from '../../lib/transform.js';
import {litHmr} from '../../lib/plugin.js';

const COMPONENT = `import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
@customElement('my-el')
export class MyEl extends LitElement {
  render() { return html\`<p>hi</p>\`; }
}
`;

describe('transformLitModule', () => {
  test('rewrites static lit imports to wrapper modules', async () => {
    const result = await transformLitModule(COMPONENT);
    expect(result).not.toBeNull();
    expect(result!.code).toContain(`from '${VIRTUAL_PREFIX}lit'`);
    // Non-wrapped lit-family subpaths are left alone.
    expect(result!.code).toContain(`from 'lit/decorators.js'`);
  });

  test('rewrites export-from specifiers', async () => {
    const result = await transformLitModule(`export {html, css} from 'lit';\n`);
    expect(result!.code).toContain(
      `export {html, css} from '${VIRTUAL_PREFIX}lit';`
    );
  });

  test('rewrites string-literal dynamic imports', async () => {
    const result = await transformLitModule(
      `const lit = await import('lit-html');\n`
    );
    expect(result!.code).toContain(`import('${VIRTUAL_PREFIX}lit-html')`);
  });

  test('leaves variable dynamic imports alone', async () => {
    const code = `const spec = 'lit';\nexport const load = () => import(spec);\n`;
    expect(await transformLitModule(code)).toBeNull();
  });

  test('rewrites every wrap-table specifier', async () => {
    for (const spec of [
      'lit',
      'lit/html.js',
      'lit/static-html.js',
      'lit-html',
      'lit-html/static.js',
      'lit-element',
      'lit-element/lit-element.js',
      '@lit/reactive-element',
      '@lit/reactive-element/css-tag.js',
      '@lit-labs/signals',
    ]) {
      const result = await transformLitModule(
        `import {html} from '${spec}';\n`
      );
      expect(result?.code, spec).toContain(`'${VIRTUAL_PREFIX}${spec}'`);
    }
  });

  test('injects install + self-accept for component modules', async () => {
    const result = await transformLitModule(COMPONENT);
    expect(result!.code.startsWith(`import '${INSTALL_ID}';\n`)).toBe(true);
    expect(result!.code).toContain('import.meta.hot?.accept();');
  });

  test('injects for plain customElements.define modules without lit', async () => {
    const code = `class Plain extends HTMLElement {}\ncustomElements.define('plain-el', Plain);\n`;
    const result = await transformLitModule(code);
    expect(result!.code.startsWith(`import '${INSTALL_ID}';\n`)).toBe(true);
    expect(result!.code).toContain('import.meta.hot?.accept();');
  });

  test('does not inject install/accept for non-component lit modules', async () => {
    const result = await transformLitModule(
      `import {html} from 'lit';\nexport const header = html\`<h2>x</h2>\`;\n`
    );
    expect(result!.code).not.toContain('install');
    expect(result!.code).not.toContain('import.meta.hot');
  });

  test('returns null for unrelated modules', async () => {
    expect(await transformLitModule(`export const x = 1;\n`)).toBeNull();
  });

  test('is idempotent on its own output', async () => {
    const once = await transformLitModule(COMPONENT);
    expect(await transformLitModule(once!.code)).toBeNull();
  });

  test('produces a sourcemap', async () => {
    const result = await transformLitModule(COMPONENT);
    expect(result!.map).toBeTruthy();
    expect(result!.map.mappings.length).toBeGreaterThan(0);
  });
});

describe('isComponentModule', () => {
  test('detects customElements.define textually', () => {
    expect(isComponentModule(`customElements.define('x-y', XY);`, false)).toBe(
      true
    );
  });

  test('detects customElement decorator calls only with lit imports', () => {
    const code = `customElement('x-y')(XY);`;
    expect(isComponentModule(code, true)).toBe(true);
    expect(isComponentModule(code, false)).toBe(false);
  });
});

describe('litHmr plugin transform filter', () => {
  const plugin = litHmr();
  const callTransform = (code: string, id: string, ssr?: boolean) => {
    const hook = plugin.transform as (
      code: string,
      id: string,
      opts?: {ssr?: boolean}
    ) => Promise<unknown>;
    return hook.call(undefined, code, id, ssr ? {ssr} : undefined);
  };

  test('skips node_modules', async () => {
    expect(
      await callTransform(COMPONENT, '/repo/node_modules/lib/index.js')
    ).toBeNull();
  });

  test('skips virtual ids', async () => {
    expect(await callTransform(COMPONENT, '\0some-virtual')).toBeNull();
  });

  test('skips ssr transforms', async () => {
    expect(await callTransform(COMPONENT, '/app/src/el.ts', true)).toBeNull();
  });

  test('skips non-JS assets', async () => {
    expect(await callTransform(COMPONENT, '/app/src/styles.css')).toBeNull();
  });

  test('transforms user TS modules', async () => {
    expect(await callTransform(COMPONENT, '/app/src/el.ts')).not.toBeNull();
  });

  test('transforms inline html-proxy scripts', async () => {
    expect(
      await callTransform(COMPONENT, '/app/index.html?html-proxy&index=0.js')
    ).not.toBeNull();
  });
});
