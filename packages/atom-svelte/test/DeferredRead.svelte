<script lang="ts">
  import { provideRegistry, useAtomValue, type Atom, type AtomRegistry } from "atom-svelte"
  import { untrack } from "svelte"

  const {
    atom,
    registry,
    mapped = false
  }: {
    atom: Atom.Atom<number>
    registry: AtomRegistry.AtomRegistry
    mapped?: boolean
  } = $props()

  const initial = untrack(() => ({ atom, registry, mapped }))

  provideRegistry(initial.registry)

  let selected = $state(initial.atom)
  let visible = $state(false)

  const atomState = initial.mapped
    ? useAtomValue(
        () => selected,
        (n) => n * 2
      )
    : useAtomValue(() => selected)

  const value = $derived(atomState.current)

  export function read() {
    return value
  }

  export function select(atom: Atom.Atom<number>) {
    selected = atom
  }

  export function show() {
    visible = true
  }

  export function hide() {
    visible = false
  }
</script>

{#if visible}<span data-testid="value">{value}</span>{/if}
