/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {cssBlobUrl} from '@lit-labs/vite-hmr/css.js';
import cssContent from './hmr-linked-css.css?inline';

/**
 * External stylesheet loaded via <link> in shadow root.
 *
 * Vite serves CSS files as JavaScript modules, so we can't point a <link>
 * href directly at a .css URL. Instead we import the CSS content as a string
 * via the `?inline` query parameter and serve it through `cssBlobUrl`.
 *
 * When the .css file changes, Vite's HMR invalidates the `?inline` module,
 * which propagates to this component module (self-accepting via the Lit HMR
 * plugin). The module re-executes with the new CSS content, which maps to a
 * fresh object URL, and the component re-renders with the new <link> href.
 */

@customElement('hmr-linked-css')
export class HmrLinkedCss extends LitElement {
  private renders = 0;

  override render() {
    return html`
      <link rel="stylesheet" href="${cssBlobUrl(cssContent)}" />
      <h2>Linked CSS</h2>
      <div id="linked-box">styled via &lt;link&gt;</div>
      <span class="badge" id="badge">renders: 0</span>
    `;
  }

  override updated() {
    this.renders++;
    this.setAttribute('data-renders', String(this.renders));
    const badge = this.renderRoot.querySelector('#badge');
    if (badge !== null) {
      badge.textContent = `renders: ${this.renders}`;
    }
  }
}
