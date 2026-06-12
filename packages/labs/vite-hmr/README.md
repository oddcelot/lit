# @lit-labs/vite-hmr

A dev-only Vite plugin providing true hot module replacement for Lit
components.

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/).
> It is published in order to get feedback on the design and may receive
> breaking changes or stop being supported.

## Why

lit-html decides "is this the same template?" by **object identity** of the
`TemplateStringsArray`, not by content. Vite HMR re-executes an edited
module, so every `` html`...` `` produces a fresh strings array and lit
rebuilds the component's **entire** subtree for a one-character edit: focus,
scroll, and input state are lost, child `@state` resets, and cached DOM
references are orphaned.

This plugin fixes that with two cooperating mechanisms:

1. **Template-strings interning** — the `html`/`svg`/`mathml`/`css` tags are
   wrapped in dev so strings arrays are canonicalized by content. Unchanged
   templates keep their identity across re-execution, so only the **edited**
   template rebuilds its part of the DOM. Sibling templates, child
   components, focus, selection, and constructed stylesheets all survive.
2. **In-place class patching** — a `customElements.define` interceptor
   catches the duplicate define from the re-executed module and patches the
   originally-registered class in place: prototype and static descriptors
   are copied over, reactive property values are snapshotted and restored
   through the new accessors, styles are re-adopted, and live instances
   re-render once.

## Usage

```ts
// vite.config.ts
import {defineConfig} from 'vite';
import {litHmr} from '@lit-labs/vite-hmr';

export default defineConfig({
  plugins: [litHmr()],
});
```

The plugin only applies to the dev server (`apply: 'serve'`); production
builds are untouched.

## Options

| Option           | Type                 | Default    | Description                                                                                                                        |
| ---------------- | -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `reconnect`      | `boolean`            | `false`    | Cycle `disconnectedCallback()`/`connectedCallback()` on live instances after a hot patch. Interning makes this mostly unnecessary. |
| `onIncompatible` | `'reload' \| 'warn'` | `'reload'` | What to do when a component can't be hot-patched in place: automatically reload the page, or only warn in the console.             |

## Signals

`@lit-labs/signals` is supported: its `html`/`svg` tags are interned just
like the core ones, the `SignalWatcher` mixin's regenerated class chain is
re-parented during a patch, and both per-instance signals and signals
imported from other modules keep their value and reactivity across an
update.

One caveat applies to all module-level state, not just signals: a
module-level `signal()` declared **inside an edited component module** is
re-created (with its initial value) when that module re-executes. Keep
shared signals in their own non-component module and import them — that
module never re-executes, so the signal object survives.

## Context

`@lit/context` is supported, including the experimental-decorator
`@provide`/`@consume` forms: those keep per-class-evaluation state (a
WeakMap of instance → controller populated via `addInitializer`), so during
a patch the runtime re-runs the class initializers for live instances to
enroll them in the new closures, then restores the provided value through
the new accessors — subscribed consumers keep both their value and a live
subscription. Controllers created by previous evaluations stay attached but
inert; that's bounded by edit count and cleared by any reload.

Define the context key in its own module (and prefer string keys —
`createContext('my-context')` is identity-by-value, a `Symbol()` key is
not), the same way you'd isolate any shared module-level state.

## Limitations

- **Standard `accessor` decorators**: reactive properties declared with
  standard (TC39) decorators close over per-class-evaluation private slots
  and cannot be patched in place. This is detected deterministically and
  falls back to a full reload (or a warning, per `onIncompatible`) — never a
  broken state. Experimental decorators (`@customElement`, `@property`,
  `@state` with `experimentalDecorators: true`) and `static properties` are
  fully supported.
- **Native `#private` fields**: methods copied from the new class that touch
  `#private` state will brand-check-throw on existing instances (this also
  triggers the reload fallback). Use TS `private` instead.
- **Mixed exports**: a module exporting a component _and_ other values
  self-accepts, so importers keep the previously-imported non-class bindings
  until they themselves re-execute. Class exports stay valid — the canonical
  class object is patched in place.
- **`observedAttributes` changes**: the platform snapshots them at define
  time; a console message recommends a reload when they change.
- **Interning map growth**: stale versions of edited templates accumulate in
  the (page-global) intern map over a dev session. This is bounded by the
  number of edits and cleared by any full reload.
- The Rolldown full-bundle dev mode is unsupported; the plugin targets the
  standard Vite dev server pipeline.

## Playground

A manually inspectable fixture app (also the source for the e2e fixtures):

```sh
cd packages/labs/vite-hmr
npm run dev   # http://localhost:5179
```

Edit the templates, styles, and labels in `playground/src/*.ts` and watch
counts, focus, and DOM identity survive. The page HUD counts HMR updates;
every component shows a `renders: n` badge.

## Tests

```sh
cd packages/labs/vite-hmr
npm test            # unit + e2e
npm run test:unit   # node-only unit tests
npm run test:e2e    # spawns vite dev servers + system Chrome
```

The e2e suite drives the real dev server with playwright-core and the system
Chrome (`channel: 'chrome'`). Environment variables:

- `HMR_E2E_HEADED=1` — watch the browser while tests run.
- `HMR_E2E_EXECUTABLE=/path/to/chrome` — use a specific browser binary
  (e.g. after `npx playwright install chromium` if no system Chrome is
  available).

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
