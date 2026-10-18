<script lang="ts">
  import { RegistryProvider, HydrationBoundary, type Atom, type AtomRegistry, type Hydration } from "atom-svelte"
  import Probe from "./Probe.svelte"
  const { atom, registry, state, onRegistry, scheduleTask }: {
    atom: Atom.Writable<number>
    registry?: AtomRegistry.AtomRegistry
    state?: Iterable<Hydration.DehydratedAtom>
    onRegistry: (registry: AtomRegistry.AtomRegistry) => void
    scheduleTask?: (f: () => void) => () => void
  } = $props()
</script>
<RegistryProvider {registry} {scheduleTask}>
  <HydrationBoundary {state}>
    <Probe {atom} {onRegistry} />
  </HydrationBoundary>
</RegistryProvider>
