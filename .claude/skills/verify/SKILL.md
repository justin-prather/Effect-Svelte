---
name: verify
description: Use to verify changes in this monorepo end-to-end — after editing packages/atom-svelte, packages/form-svelte, or examples/, or when tests/typechecks behave confusingly. Encodes the build-order dependency, the dist-import gotcha, and how to drive the example apps.
---

# Verifying changes in effect-svelte

## The one rule that trips everything: build order

`packages/form-svelte` (types, tests, examples) resolves `atom-svelte` through its **built
`dist/`**, and package tests import the package **by name** (built output), not `src/`. So after
editing any package source, rebuild before checking or testing anything downstream. The root
scripts already chain this correctly — prefer them:

```sh
bun run check            # build both packages, then svelte-check each (0 errors AND 0 warnings expected)
bun run test             # build, then vitest (jsdom) in both packages
bun run build:examples   # build packages, then build + prerender both SvelteKit examples
bun run test:examples    # adversarial SSR check: build both examples outside the repo with an incompatible parent cookie
bun run lint             # Oxlint, including the vendored anti-slop rules
bun run analyze          # Fallow: unused code, dependencies, duplication, and complexity
bun run format:check     # Oxfmt, including Svelte components
```

Symptom of a stale/missing dist: `Cannot find module 'atom-svelte'` or types collapsing to `any`
(e.g. "'x' is of type 'unknown'", "implicitly has an 'any' type") cascading through form-svelte.
Fix by rebuilding, not by loosening types.

## What each layer proves

| Command | Proves |
| --- | --- |
| `svelte-check` (via `bun run check`) | source + test/example components typecheck, including extra-props inference through `Component<>` |
| `vitest` (via `bun run test`) | client runtime behavior: subscriptions, `bind:current`, registry isolation, promise-mode, full form flow (init → edit → array paths → validation → submit) |
| `bun run build:examples` | **SSR** — both examples prerender (`prerender = true`), which executes the generated components server-side. Confirm by grepping the output, e.g. `grep 'Basic Form' examples/form-demo/build/index.html` |
| `bun run test:examples` | **nested-workspace SSR isolation** — copies each example outside the repo next to an incompatible parent `cookie@2` package, asserts the build prerenders, and asserts the generated server bundle has no bare `cookie` import |
| example `check` scripts (`bun run --cwd examples/<app> check`) | the public API from a consumer's perspective (runs `svelte-kit sync` first) |

A change to hooks/reactivity plumbing or the form component factory is not verified until all
three layers pass — typecheck alone misses runtime subscription bugs, and jsdom tests alone miss
SSR. Changes touching SSR dependency resolution, workspace layout, or the examples' build config
also need `bun run test:examples`.

## Running the apps (manual verification)

```sh
bun run --cwd examples/atom-demo dev    # counter / async Result / promise-mode demo
bun run --cwd examples/form-demo dev    # profile form: onBlur validation, links array, reset
```

Remember `bun run build` first if package source changed — the dev servers also consume `dist/`.

## Writing new tests

- jsdom + `mount`/`flushSync`/`unmount` from `svelte`; no testing-library. Dispatch real DOM
  events (`new Event("input", { bubbles: true })`; `blur` does not bubble — dispatch it directly
  on the element).
- Interactions need `flushSync()` before asserting; async atom settling uses `vi.waitFor` with a
  `flushSync()` inside the callback.
- Tests share the global `defaultRegistry` — create fresh atoms per test (or mount inside
  `RegistryProvider` with a fresh `Registry.make()`), and unmount in `afterEach`.
