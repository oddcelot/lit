/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import cssHref from './hmr-linked-css.css?blob-url';

/**
 * External stylesheet loaded via <link> in shadow root.
 *
 * Vite serves CSS files as JavaScript modules, so we can't point a <link>
 * href directly at a .css URL. The plugin's `?blob-url` import query bridges
 * the gap: it yields an object URL serving the file's CSS text (a `?inline`
 * import piped through the `cssBlobUrl` helper under the hood).
 *
 * When the .css file changes, Vite's HMR propagates through the query's
 * wrapper module to this component module (self-accepting via the Lit HMR
 * plugin). Re-execution imports a fresh object URL for the new CSS text and
 * the component re-renders with the new <link> href.
 */

@customElement('hmr-linked-css')
export class HmrLinkedCss extends LitElement {
  private renders = 0;

  override render() {
    return html`
      <link rel="stylesheet" href="${cssHref}" />
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
