<script lang="ts">
  import { RegistryProvider, type Atom, type Registry } from "atom-svelte"
  import Counter from "./Counter.svelte"

  const { atom, registry }: { atom: Atom.Writable<number>; registry: Registry.Registry } = $props()
</script>

<RegistryProvider {registry}>
  <Counter {atom} />
</RegistryProvider>
