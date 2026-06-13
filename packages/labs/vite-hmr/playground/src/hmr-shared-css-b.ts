/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import cssHref from './hmr-shared.css?hmr-url';

/**
 * Second component sharing the `hmr-shared.css` stylesheet with
 * `hmr-shared-css-a`. Both reference the same URL; the browser fetches the
 * CSS once and each shadow root applies it independently.
 */

@customElement('hmr-shared-css-b')
export class HmrSharedCssB extends LitElement {
  private renders = 0;

  override render() {
    return html`
      <link rel="stylesheet" href="${cssHref}" />
      <h2>Shared CSS — B</h2>
      <div class="shared-card">Component B</div>
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
