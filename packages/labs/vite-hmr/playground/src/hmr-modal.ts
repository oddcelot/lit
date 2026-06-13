/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import './hmr-modal-child.js';

/**
 * Parent that opens a native <dialog> modal containing a child counter.
 * The dialog's open/closed state must survive HMR updates to the child.
 */
@customElement('hmr-modal')
export class HmrModal extends LitElement {
  static override styles = css`
    .open-btn {
      padding: 0.5em 1em;
      font-size: 1rem;
      cursor: pointer;
    }
    .badge {
      font-size: 0.8em;
      color: var(--muted, #666);
      margin-left: 0.5rem;
    }
    dialog {
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--card-border, #ccc);
      max-width: 400px;
      width: 90%;
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.4);
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .close-btn:hover {
      background: var(--card-border, #eee);
    }
  `;

  @state()
  private open = false;

  private renders = 0;

  override render() {
    return html`
      <div>
        <button class="open-btn" id="open-btn" @click=${this.openDialog}>
          Open modal
        </button>
        <span class="badge" id="badge">renders: 0</span>
      </div>
      <dialog id="dialog">
        <div class="dialog-header">
          <h2>Modal dialog</h2>
          <button class="close-btn" id="close-btn" @click=${this.closeDialog}>
            ✕
          </button>
        </div>
        <hmr-modal-child id="child"></hmr-modal-child>
      </dialog>
    `;
  }

  override updated() {
    this.renders++;
    this.setAttribute('data-renders', String(this.renders));
    const badge = this.renderRoot.querySelector('#badge');
    if (badge !== null) {
      badge.textContent = `renders: ${this.renders}`;
    }
    const dialog = this.renderRoot.querySelector<HTMLDialogElement>('#dialog');
    if (dialog !== null) {
      if (this.open && !dialog.open) {
        dialog.showModal();
      } else if (!this.open && dialog.open) {
        dialog.close();
      }
    }
  }

  private openDialog() {
    this.open = true;
  }

  private closeDialog() {
    this.open = false;
  }
}
