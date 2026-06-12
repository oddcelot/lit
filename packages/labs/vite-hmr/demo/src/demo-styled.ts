/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * Edit the background color in the `css` block — the box restyles in
 * place; the DOM node is not recreated.
 */
@customElement('demo-styled')
export class DemoStyled extends LitElement {
  static override styles = css`
    #box {
      background: rebeccapurple;
      color: #fff;
      padding: 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
  `;

  override render() {
    return html`
      <h2>Styles — change my color</h2>
      <div id="box">edit my background in demo-styled.ts</div>
    `;
  }
}
