# @lit-labs/vite-hmr

A dev-only Vite plugin providing true hot module replacement for Lit
components: template-strings interning plus in-place class patching, so an
edit to one template rebuilds only that template's DOM — sibling templates,
child components, focus, and `@state` survive.

> Status: experimental. Part of the Lit Labs family.

## Usage

```ts
// vite.config.ts
import {defineConfig} from 'vite';
import {litHmr} from '@lit-labs/vite-hmr';

export default defineConfig({
  plugins: [litHmr()],
});
```

Documentation will grow with the implementation. See the plan in the package
source for details on options, limitations, the playground, and tests.
