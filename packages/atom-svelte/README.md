# atom-svelte

Svelte 5 bindings for [Effect v4 atoms](https://github.com/Effect-TS/effect/tree/main/packages/effect/src/reactivity).
The API follows `@effect/atom-react`.

Requires `effect@^4.0.5` and Svelte 5. The separate `@effect-atom/atom` dependency is no longer necessary.

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

Mirrors `@effect/atom-react`:

- `useAtomValue(atom, f?)` → `{ readonly current }`
- `useAtom(atom, options?)` → `{ current, set }` — assignment to `current` writes to the registry
  (enables `bind:current`); `set` supports updater functions and `mode: "promise" | "promiseExit"`
- `useAtomSet(atom, options?)`, `useAtomRefresh(atom)`, `useAtomMount(atom)`,
  `useAtomSubscribe(atom, f, options?)`, `useAtomInitialValues(values)`
- `useAtomRef(ref)`, `useAtomRefProp(ref, prop)`, `useAtomRefPropValue(ref, prop)`
- `useAtomSuspense(atom, options?)` → `{ readonly current: Promise<AsyncResult.Success> }`, designed for
  `{#await}` blocks instead of React Suspense
- `RegistryProvider` / `HydrationBoundary` components; `useRegistry()` / `provideRegistry(registry)`
  context helpers; `defaultRegistry`
- `ScopedAtom.make(f)` → `{ provide(input?), use() }` (Svelte context instead of a Provider
  component)
- Re-exports from `effect/reactivity`: `Atom`, `AtomRegistry`, `AsyncResult`, `AtomRef`, `AtomHttpApi`, `AtomRpc`, `Hydration`.
- Compatibility aliases: `Registry` refers to `AtomRegistry`, and `Result` refers to `AsyncResult`.

## Migration from Effect v3

Replace direct `@effect-atom/atom/*` imports with `effect/reactivity/*` imports.
The `Registry` module becomes `AtomRegistry`. The `Result` module becomes `AsyncResult`.
The registry type is `AtomRegistry.AtomRegistry`, including through the `Registry` alias.
The result type is `AsyncResult.AsyncResult<A, E>`, including through the `Result` alias.

Custom `RegistryProvider` schedulers must return a cancellation function:

```ts
const scheduleTask = (f: () => void) => {
  const id = setTimeout(f, 0)
  return () => clearTimeout(id)
}
```

The atom modules are unstable upstream. Minor Effect releases can change their APIs.

## Differences from atom-react

- Values are read via `.current` (reactive getter), not returned directly from the hook.
- `useAtom` returns a single read/write box instead of a `[value, setter]` tuple.
- `current` reads the atom's read type and accepts its write type on assignment.
  `bind:current` remains available when both types match.
- React's `Suspense`-throwing `useAtomSuspense` becomes a stable-promise box for `{#await}`.
- No scheduler dependency; the registry uses its default task scheduling.
- `RegistryProvider` disposes registries it creates. An external registry remains the caller's responsibility.
