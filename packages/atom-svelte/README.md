# atom-svelte

Svelte 5 bindings for [`@effect-atom/atom`](https://github.com/tim-smart/effect-atom), mirroring the
API of `@effect-atom/atom-react`.

## Usage

```svelte
<script lang="ts">
  import { Atom, useAtom, useAtomValue } from "atom-svelte"
  import * as Effect from "effect/Effect"

  const countAtom = Atom.make(0)
  const count = useAtom(countAtom)
  const doubled = useAtomValue(countAtom, (n) => n * 2)
</script>

<button onclick={() => count.set((n) => n + 1)}>{count.current}</button>
<input type="number" bind:value={count.current} />
<p>doubled: {doubled.current}</p>
```

All hooks must be called during component initialization (like every framework binding for
effect-atom). They return reactive boxes with a `current` property rather than plain values, since
Svelte functions cannot return bare reactive primitives. Every hook also accepts a thunk
(`() => atom`) when the atom itself is derived from reactive state.

## API

Mirrors `@effect-atom/atom-react`:

- `useAtomValue(atom, f?)` → `{ readonly current }`
- `useAtom(atom, options?)` → `{ current, set }` — assignment to `current` writes to the registry
  (enables `bind:current`); `set` supports updater functions and `mode: "promise" | "promiseExit"`
- `useAtomSet(atom, options?)`, `useAtomRefresh(atom)`, `useAtomMount(atom)`,
  `useAtomSubscribe(atom, f, options?)`, `useAtomInitialValues(values)`
- `useAtomRef(ref)`, `useAtomRefProp(ref, prop)`, `useAtomRefPropValue(ref, prop)`
- `useAtomSuspense(atom, options?)` → `{ readonly current: Promise<Result.Success> }`, designed for
  `{#await}` blocks instead of React Suspense
- `RegistryProvider` / `HydrationBoundary` components; `useRegistry()` / `provideRegistry(registry)`
  context helpers; `defaultRegistry`
- `ScopedAtom.make(f)` → `{ provide(input?), use() }` (Svelte context instead of a Provider
  component)
- Re-exports: `Atom`, `Registry`, `Result`, `AtomRef`, `AtomHttpApi`, `AtomRpc`, `Hydration`

## Differences from atom-react

- Values are read via `.current` (reactive getter), not returned directly from the hook.
- `useAtom` returns a single read/write box instead of a `[value, setter]` tuple.
- React's `Suspense`-throwing `useAtomSuspense` becomes a stable-promise box for `{#await}`.
- No scheduler dependency; the registry uses its default task scheduling.
