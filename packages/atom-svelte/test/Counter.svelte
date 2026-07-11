<script lang="ts">
  import { useAtom, useAtomValue, type Atom } from "atom-svelte"

  const { atom }: { atom: Atom.Writable<number> } = $props()

  const count = useAtom(() => atom)
  const doubled = useAtomValue(() => atom, (n) => n * 2)
</script>

<button onclick={() => count.set((n) => n + 1)}>{count.current}</button>
<span data-testid="doubled">{doubled.current}</span>
<input data-testid="bound" type="number" bind:value={count.current} />
