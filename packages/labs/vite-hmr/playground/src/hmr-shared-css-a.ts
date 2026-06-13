/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import cssHref from './hmr-shared.css?hmr-url';

/**
 * First component sharing the `hmr-shared.css` stylesheet with
 * `hmr-shared-css-b`. Both load the same `.css` file via `<link>` in their
 * shadow roots. When the CSS file changes, both components update.
 */

@customElement('hmr-shared-css-a')
export class HmrSharedCssA extends LitElement {
  private renders = 0;

  override render() {
    return html`
      <link rel="stylesheet" href="${cssHref}" />
      <h2>Shared CSS — A</h2>
      <div class="shared-card">Component A</div>
      <span class="shared-badge" id="badge">renders: 0</span>
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
