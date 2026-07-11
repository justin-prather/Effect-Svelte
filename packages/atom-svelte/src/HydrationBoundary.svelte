<script lang="ts">
  import * as Hydration from "@effect-atom/atom/Hydration"
  import type { Snippet } from "svelte"
  import { useRegistry } from "./RegistryContext.js"

  interface Props {
    readonly state?: Iterable<Hydration.DehydratedAtom> | undefined
    readonly children?: Snippet | undefined
  }

  const { state, children }: Props = $props()

  const registry = useRegistry()

  // Hydrate synchronously during init so children see the values on their
  // first render (including during SSR hydration).
  // svelte-ignore state_referenced_locally
  let hydrated = state
  // svelte-ignore state_referenced_locally
  if (state !== undefined) {
    // svelte-ignore state_referenced_locally
    Hydration.hydrate(registry, state)
  }

  // Re-hydrate when the dehydrated state changes (e.g. on navigation).
  $effect.pre(() => {
    if (state !== undefined && state !== hydrated) {
      Hydration.hydrate(registry, state)
    }
    hydrated = state
  })
</script>

{@render children?.()}
