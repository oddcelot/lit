/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Custom element for the HMR update indicator.
 * The shadow DOM is provided via Declarative Shadow Root from the plugin's
 * `transformIndexHtml` hook. This class only drives the animation and count.
 *
 * Usage:
 *   <lit-devtools-indicator></lit-devtools-indicator>    — round dot
 *   <lit-devtools-indicator count></lit-devtools-indicator>  — pill with count
 */

class LitDevtoolsIndicator extends HTMLElement {
  #initialized = false;
  #count = 0;
  #countEl: HTMLElement | null = null;

  connectedCallback() {
    if (this.#initialized) return;
    this.#initialized = true;

    if (this.shadowRoot) {
      this.#countEl = this.shadowRoot.querySelector('.count');
    }

    (
      import.meta as {hot?: {on: (event: string, cb: () => void) => void}}
    ).hot?.on('vite:afterUpdate', () => {
      if (this.#countEl !== null) {
        this.#countEl.textContent = String(++this.#count);
      }
      this.classList.remove('active');
      void this.offsetWidth;
      this.classList.add('active');
    });
  }
}

customElements.define('lit-devtools-indicator', LitDevtoolsIndicator);
