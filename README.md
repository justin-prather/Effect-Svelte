# effect-svelte

A bun monorepo containing Svelte 5 ports of the React bindings for two Effect libraries:

| Package                                        | Port of                                                                                   | Core library (unchanged, from npm) |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| [`packages/atom-svelte`](packages/atom-svelte) | [`@effect/atom-react`](https://github.com/Effect-TS/effect/tree/main/packages/atom/react) | `effect/reactivity` (Effect v4)    |
| [`packages/form-svelte`](packages/form-svelte) | [`@lucas-barake/effect-form-react`](https://github.com/lucas-barake/effect-form)          | `@lucas-barake/effect-form` (v1)   |

Both React packages are thin binding layers over framework-agnostic cores, so these ports keep the
core packages as dependencies and re-implement only the binding layer with Svelte 5 runes.

## Setup

```sh
bun install
bun run analyze          # Fallow: unused code, dependencies, duplication, and complexity
bun run lint             # Oxlint, including generic and Effect anti-slop rules
bun run format:check     # Oxfmt, including Svelte components
bun run build            # builds both packages with svelte-package (atom-svelte first)
bun run check            # svelte-check both packages
bun run test             # vitest (jsdom) regression tests
bun run build:examples   # builds + prerenders both example apps (exercises SSR)
```

## Code quality

`bun run analyze` runs Fallow across both packages and the example apps.
Use `bun run analyze dead-code`, `bun run analyze health`, or `bun run analyze dupes` for individual analyses.
The `.fallowrc.json` configuration includes source entry points and excludes generated output, reference clones, and vendored rules.
Public package exports remain entry points even when no local example uses them.
The dependency exception for `@oxlint/plugins` covers imports inside the excluded vendored rules.
Review findings and analysis warnings before removing code. These commands do not apply automatic fixes.
If Fallow reports missing `.svelte-kit/tsconfig.json` files, run `bun run build:examples` to generate the example configuration.

`bun run lint:fix` applies safe lint fixes. `bun run format` formats project files.
Run lint fixes before formatting, then run `bun run lint` and `bun run format:check`.
Both commands ignore generated output, reference clones, installed skills, and vendored rules.

The Oxfmt configuration follows the Flux Suite layout but preserves this repository's existing punctuation style.
The anti-slop plugin lives in `tools/oxlint/anti-slop/`.
Its `UPSTREAM.md` records the source commit and licenses.
The installation skill is available in `.claude/skills/install-anti-slop/`.
Oxlint and `@oxlint/plugins` use matching exact versions and must move together during upgrades.

## Examples

Two SvelteKit apps in `examples/` show basic usage (run with `bun run --cwd examples/<name> dev`):

- **`examples/atom-demo`** — `atom-svelte`: writable/derived atoms with `bind:current`, an effectful
  atom rendered through its `Result` states with refresh, and a promise-mode function atom. The root
  layout provides a per-request registry via `RegistryProvider`.
- **`examples/form-demo`** — `form-svelte`: a profile form with `onBlur` validation, generated field
  components with extra props (`<f.name label="…" />`), a struct array field
  (`<f.links>` / `<f.links.Item>` / `<f.links.url>`), dirty tracking, reset, and the submit `Result`
  rendered on screen.

Both apps prerender (`prerender = true`), so `bun run build:examples` doubles as an SSR smoke test
of the generated components.

The `references/` directory (gitignored) holds shallow clones of `effect-form` and `effect` (v4).
The Effect clone includes the upstream React atom bindings.
Agent guidance for this repo (porting conventions and verification workflow) lives in
`.claude/skills/` and `CLAUDE.md`.

## Design notes

- **API fidelity**: hook names (`useAtom`, `useAtomValue`, `useAtomSet`, …) and the
  `FormSvelte.make(builder, { fields, onSubmit, mode, … })` signature match the React bindings, as do
  the Vue and Solid ports in effect-atom.
- **Reactive boxes instead of re-renders**: hooks return objects with a reactive `current` property
  (the `svelte/reactivity` convention) backed by `$state` + registry subscriptions in `$effect`,
  instead of React's `useSyncExternalStore`. `useAtom(...)` additionally supports assignment
  (`bind:current`).
- **Thunk arguments**: every hook also accepts `() => atom` so the target atom can be derived from
  reactive state (same idea as the Vue port's `() => atom` arguments).
- **Context instead of Providers where idiomatic**: `RegistryProvider` and `HydrationBoundary` exist
  as components; `ScopedAtom` uses `provide()`/`use()` functions instead of a Provider component.
- **Runtime field components**: `FormSvelte.make` returns real Svelte components per field
  (`<f.email />`, `<f.tags.Item index={i}>`), created by wrapping generic renderer components in
  config-binding functions — Svelte 5 components compile to `(internals, props)` functions in both
  client and SSR output, so the wrappers delegate transparently.
