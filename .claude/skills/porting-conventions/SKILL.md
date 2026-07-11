---
name: porting-conventions
description: Use before adding or changing any public API in packages/atom-svelte or packages/form-svelte — new hooks, form features, components, or type changes. Encodes how React APIs are translated to Svelte 5 here and the non-obvious mechanics (reactive boxes, thunk args, withConfig component wrappers, SSR calling convention).
---

# Porting conventions (React → Svelte 5)

Prime directive: **hold true to the upstream React API where possible, but use Svelte practices.**
Before implementing anything, read the upstream source in `references/` (see the `references`
skill) — atom-react/form-react for the contract, atom-vue/atom-solid for how other fine-grained
frameworks adapted it.

## Translation rules

| React | Here |
| --- | --- |
| hook returns a value (re-render on change) | return a box with a reactive `current` getter (`$state` version counter + `$effect` registry subscription; getter always reads fresh from the registry so it is SSR-safe and never stale pre-mount) |
| `useAtom` → `[value, setter]` tuple | single box `{ current, set }`; assigning `current` writes to the registry so `bind:current` works |
| `useMemo` on `[atom, f]` | memoize manually inside the hook (see `useAtomValue`'s `Atom.map` cache) — `$derived` alone recreates atoms |
| static atom argument | also accept a thunk `() => atom` (`AtomOrGetter`); discriminate with `Atom.isAtom`, never `typeof === "function"` |
| Context Providers | `getContext`/`setContext` helpers (`useRegistry`/`provideRegistry`); components only where children must render (`RegistryProvider`, `HydrationBoundary`) |
| render-prop children | snippets — `Snippet<[args]>`, rendered with `{@render props.children?.(args)}` |
| Suspense (throw promise) | stable cached promise for `{#await}` (`useAtomSuspense`) |
| `React.FC` in types | `Component<Props>` from `svelte`; children become a `children?: Snippet` prop |

Keep upstream hook/function names (`useAtom*`, `FormSvelte.make`) even though "use" is not Svelte
idiom — API fidelity wins, and the vue/solid ports do the same.

## Hard constraints

- All hooks require **component-init context** ($effect + getContext). Same constraint as every
  other framework binding; do not try to lift it.
- Runes only work in `.svelte` / `.svelte.ts` / `.svelte.js` files — reactive code goes in
  `Hooks.svelte.ts`-style modules.
- Prefer passing thunks (`useAtomSet(() => config.atom)`) over `svelte-ignore
  state_referenced_locally`; use the ignore comment only for genuinely intentional init-time reads.
- Both packages are published uncompiled (svelte-package → `dist/` keeps `.svelte` and runes in
  `.svelte.js`); never import Svelte client internals, and keep `exports` with the `svelte`
  condition intact.

## form-svelte component factory (`withConfig`)

`FormSvelte.make` returns per-field components (`<f.email />`, `<f.tags.Item>`) built by wrapping
generic `src/internal/*Renderer.svelte` components in plain delegate functions:

```ts
(internals, props) => Renderer(internals, { config, get props() { return props } })
```

This works because Svelte 5 compiles components to `(internals, props)` functions with the same
shape in client and SSR output. If a Svelte major changes that calling convention, this is the
first thing to revisit. Rules that follow from it:

- Renderer components receive `{ config, props }`; `config` is static per generated component,
  `props` is the caller's reactive props object — forward it via getter, never spread it.
- Anything path-dependent inside renderers must be `$derived` off the array-item context
  (`internal/context.ts` provides reactive getters for `index`/`parentPath`, so indices shift
  correctly on reorder).
- Extra props typing flows through `ExtractExtraProps` — verify inference by using the new API in
  a test/example component and running svelte-check (it is part of `bun run check`).

## Checklist for a new public API

1. Read the upstream implementation(s) in `references/` (react + vue + solid where they exist).
2. Implement following the table above; export from the package `index.ts`.
3. Add a jsdom test in `test/` (tests import the **built package by name**, so `bun run build`
   first) and, if user-facing, extend the relevant `examples/` app.
4. `bun run check && bun run test` from the root; for anything touching the component factory or
   SSR, also `bun run build:examples`.
5. Document the React-vs-Svelte difference in the package README's "Differences" section.
