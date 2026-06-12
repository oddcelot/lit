/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * Type something into the input (keep it focused!), then edit the label
 * text below. The input keeps its value, focus, and caret position —
 * without the plugin the whole subtree is rebuilt and both are lost.
 */
@customElement('demo-input')
export class DemoInput extends LitElement {
  static override styles = css`
    input {
      font: inherit;
      padding: 0.3em 0.5em;
    }
    label {
      display: grid;
      gap: 0.5rem;
      justify-items: start;
    }
  `;

  override render() {
    return html`
      <h2>Focus survives</h2>
      <label>
        Edit this label while typing here:
        <input placeholder="type, then edit me" />
      </label>
    `;
  }
}
