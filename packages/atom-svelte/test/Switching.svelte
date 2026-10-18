<script lang="ts">
  import { useAtomValue, type Atom } from "atom-svelte"

  const { first, second }: { first: Atom.Atom<number>; second: Atom.Atom<number> } = $props()
  let switched = $state(false)
  const value = useAtomValue(() => (switched ? second : first))
</script>

<button onclick={() => (switched = true)}>switch</button>
<span data-testid="value">{value.current}</span>
