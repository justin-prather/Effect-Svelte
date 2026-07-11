<script lang="ts">
  import { RegistryProvider } from "atom-svelte"
  import type { Snippet } from "svelte"

  const { children }: { children: Snippet } = $props()
</script>

<!--
  Providing a registry at the root gives each server-rendered request its own
  isolated atom state. Without it, everything falls back to a shared global
  `defaultRegistry`.
-->
<RegistryProvider>
  <main>
    <h1>atom-svelte demo</h1>
    {@render children()}
  </main>
</RegistryProvider>

<style>
  main {
    max-width: 40rem;
    margin: 2rem auto;
    padding: 0 1rem;
    font-family: system-ui, sans-serif;
    line-height: 1.5;
  }
</style>
