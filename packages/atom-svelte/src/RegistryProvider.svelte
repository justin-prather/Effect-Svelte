<script lang="ts">
  import * as Registry from "@effect-atom/atom/Registry"
  import { onDestroy, type Snippet } from "svelte"
  import { provideRegistry, type RegistryOptions } from "./RegistryContext.js"

  interface Props extends RegistryOptions {
    /**
     * Provide an existing registry instead of creating one. When given, the
     * provider will not dispose it on unmount.
     */
    readonly registry?: Registry.Registry | undefined
    readonly children?: Snippet | undefined
  }

  const {
    registry,
    initialValues,
    scheduleTask,
    timeoutResolution,
    defaultIdleTTL,
    children
  }: Props = $props()

  // The registry is intentionally created once from the initial props; it is
  // not recreated when props change.
  // svelte-ignore state_referenced_locally
  const provided = registry ??
    Registry.make({ scheduleTask, initialValues, timeoutResolution, defaultIdleTTL })
  provideRegistry(provided)

  // svelte-ignore state_referenced_locally
  if (registry === undefined) {
    onDestroy(() => provided.dispose())
  }
</script>

{@render children?.()}
