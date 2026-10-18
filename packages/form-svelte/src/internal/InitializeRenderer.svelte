<script lang="ts">
  import { useAtomMount, useAtomSet, useAtomValue, useRegistry } from "atom-svelte"
  import * as Option from "effect/Option"
  import type { Snippet } from "svelte"

  import type { InitializeRendererConfig } from "./types.js"

  const {
    config,
    props
  }: {
    config: InitializeRendererConfig
    props: {
      readonly defaultValues: any
      readonly validateOnInit?: boolean
      readonly children?: Snippet
    }
  } = $props()

  const registry = useRegistry()
  const state = useAtomValue(() => config.stateAtom)
  const initialize = useAtomSet(() => config.initializeAtom)
  const triggerValidate = useAtomSet(() => config.validateAtom)

  // Initialize synchronously from the initial props so children render with
  // form state available on the first pass (unlike React, no effect timing is
  // needed here). `config` never changes for a given generated component.
  // svelte-ignore state_referenced_locally
  const shouldInit =
    !registry.get(config.keepAliveActiveAtom) || Option.isNone(registry.get(config.stateAtom))

  if (shouldInit) {
    // svelte-ignore state_referenced_locally
    initialize(props.defaultValues)

    // svelte-ignore state_referenced_locally
    if (props.validateOnInit) {
      triggerValidate(undefined)
    }
  }

  useAtomMount(() => config.autoSubmitAtom)
</script>

{#if Option.isSome(state.current)}
  {@render props.children?.()}
{/if}
