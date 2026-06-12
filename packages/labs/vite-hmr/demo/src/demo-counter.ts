/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';

/**
 * Click the button a few times, then edit the heading below.
 * The count (`@state`) survives the hot patch.
 */
@customElement('demo-counter')
export class DemoCounter extends LitElement {
  static override styles = css`
    button {
      font-size: 1.1em;
      padding: 0.4em 1em;
    }
  `;

  @state()
  private count = 0;

  override render() {
    return html`
      <h2>Counter — edit me!</h2>
      <button @click=${() => this.count++}>Count: ${this.count}</button>
    `;
  }
}
