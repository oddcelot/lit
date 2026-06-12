/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {cssBlobUrl} from '@lit-labs/vite-hmr/css.js';
import cssContent from './hmr-import-css.css?inline';

/**
 * Styles loaded via @import inside a <style> element in the shadow root.
 *
 * Vite serves CSS files as JavaScript modules, so an @import url() pointing
 * at a .css URL would receive JS, not CSS. Instead we import the CSS content
 * as a string via the `?inline` query parameter and serve it through
 * `cssBlobUrl`.
 *
 * When the .css file changes, Vite's HMR invalidates the `?inline` module,
 * which propagates to this component module. The module re-executes with the
 * new CSS content, which maps to a fresh object URL, and the component
 * re-renders with the new @import URL.
 */

@customElement('hmr-import-css')
export class HmrImportCss extends LitElement {
  private renders = 0;

  override render() {
    return html`
      <style>
        @import url('${cssBlobUrl(cssContent)}');
      </style>
      <h2>@import CSS</h2>
      <div id="imported-box">styled via @import</div>
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
