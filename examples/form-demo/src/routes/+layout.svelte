<script lang="ts">
  import { RegistryProvider } from "atom-svelte"
  import type { Snippet } from "svelte"

  const { children }: { children: Snippet } = $props()
</script>

<RegistryProvider>
  <main>
    <h1>form-svelte demo</h1>
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
