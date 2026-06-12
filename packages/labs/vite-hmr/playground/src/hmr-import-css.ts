/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import cssContent from './hmr-import-css.css?inline';

/**
 * Styles loaded via @import inside a <style> element in the shadow root.
 *
 * Vite serves CSS files as JavaScript modules, so an @import url() pointing
 * at a .css URL would receive JS, not CSS. Instead we import the CSS content
 * as a string via the `?inline` query parameter and create an object URL.
 *
 * When the .css file changes, Vite's HMR invalidates the `?inline` module,
 * which propagates to this component module. The module re-executes with the
 * new CSS content, the object URL refreshes, and the component re-renders
 * with the updated @import URL.
 */

// Module-level cache: on HMR re-execution the `let` resets to '' and the
// import gets the new CSS string, so the next render creates a fresh URL.
let _url = '';
const getCssUrl = () => {
  if (!_url) {
    _url = URL.createObjectURL(new Blob([cssContent], {type: 'text/css'}));
  }
  return _url;
};

@customElement('hmr-import-css')
export class HmrImportCss extends LitElement {
  private renders = 0;

  override render() {
    return html`
      <style>
        @import url('${getCssUrl()}');
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
