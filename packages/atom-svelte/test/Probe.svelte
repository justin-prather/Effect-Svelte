<script lang="ts">
  import { useRegistry, useAtomValue, type Atom, type AtomRegistry } from "atom-svelte"
  const { atom, onRegistry }: {
    atom: Atom.Atom<number>
    onRegistry: (registry: AtomRegistry.AtomRegistry) => void
  } = $props()
  // Report the provider once during component initialization.
  // svelte-ignore state_referenced_locally
  onRegistry(useRegistry())
  const value = useAtomValue(() => atom)
</script>
<span data-testid="value">{value.current}</span>
