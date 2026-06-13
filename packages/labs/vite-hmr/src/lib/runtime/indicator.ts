/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Custom element for the HMR update indicator.
 * Defined as an external module so Vite's transform pipeline provides
 * `import.meta.hot`.
 *
 * Usage:
 *   <lit-devtools-indicator></lit-devtools-indicator>   — round dot
 *   <lit-devtools-indicator count></lit-devtools-indicator>  — pill with count
 */

class LitDevtoolsIndicator extends HTMLElement {
  #count = 0;
  #root: ShadowRoot;
  #countEl: HTMLElement | null = null;

  constructor() {
    super();
    const withCount = this.hasAttribute('count');
    const idleOpacity = withCount ? '.5' : '0';
    this.#root = this.attachShadow({mode: 'closed'});

    const dotStyle = `
      width:8px;
      height:8px;
      border-radius:50%;
      background:#22c55e;
      flex-shrink:0;
    `;

    this.#root.innerHTML = `
      <style>
        @keyframes pulse {
          0%{opacity:${idleOpacity}}
          15%{opacity:1}
          80%{opacity:1}
          100%{opacity:${idleOpacity}}
        }
        :host{
          position:fixed;
          bottom:16px;
          right:16px;
          z-index:2147483647;
          pointer-events:none;
          opacity:${idleOpacity};
          ${
            withCount
              ? `display:flex;align-items:center;gap:5px;padding:5px 10px 5px 7px;background:rgba(26,26,46,.85);color:#fff;border-radius:20px;font:12px/1 system-ui,sans-serif;font-variant-numeric:tabular-nums;`
              : `width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(26,26,46,.85);`
          }
        }
        :host(.active){animation:pulse 2.5s ease-out forwards}
        .dot{${dotStyle}}
      </style>
      <span class="dot"></span>
      ${withCount ? '<span class="count">0</span>' : ''}
    `;

    if (withCount) {
      this.#countEl = this.#root.querySelector('.count');
    }
  }

  connectedCallback() {
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
