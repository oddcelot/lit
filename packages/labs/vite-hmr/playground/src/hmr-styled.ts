/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * `css` static styles: editing the color must restyle without DOM loss.
 */
@customElement('hmr-styled')
export class HmrStyled extends LitElement {
  static override styles = css`
    #box {
      background: rgb(0, 128, 0);
      color: #fff;
      padding: 1rem;
      border-radius: 4px;
    }
    .badge {
      font-size: 0.8em;
      color: #666;
    }
  `;

  private renders = 0;

  override render() {
    return html`
      <h2>Styled</h2>
      <div id="box">styled box</div>
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
