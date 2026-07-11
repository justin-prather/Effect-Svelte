<script lang="ts">
  import { useAtomMount, useAtomSet } from "atom-svelte"
  import { onDestroy } from "svelte"
  import type { KeepAliveRendererConfig } from "./types.js"

  const { config }: { config: KeepAliveRendererConfig; props?: Record<string, never> } = $props()

  const setKeepAliveActive = useAtomSet(() => config.keepAliveActiveAtom)

  setKeepAliveActive(true)
  onDestroy(() => setKeepAliveActive(false))

  useAtomMount(() => config.mountAtom)
</script>
