<script lang="ts">
  import { page } from "$app/state"
  import { RegistryProvider } from "atom-svelte"
  import type { Snippet } from "svelte"

  import "../app.css"

  const { children }: { children: Snippet } = $props()

  const examples = [
    { href: "/", label: "Basic Form" },
    { href: "/validation-modes", label: "Validation Modes" },
    { href: "/array-fields", label: "Array Fields" },
    { href: "/cross-field", label: "Cross-Field Validation" },
    { href: "/async-validation", label: "Async Validation" },
    { href: "/auto-submit", label: "Auto-Submit" },
    { href: "/multi-step", label: "Multi-Step Wizard" },
    { href: "/revert-changes", label: "Revert Changes" }
  ]
</script>

<RegistryProvider>
  <div class="container">
    <nav class="nav">
      <h2 class="navTitle">Effect Form Examples</h2>
      <ul class="navList">
        {#each examples as example (example.href)}
          <li>
            <a
              href={example.href}
              class="navLink"
              class:active={page.url.pathname === example.href}
            >
              {example.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
    <main class="main">
      {@render children()}
    </main>
  </div>
</RegistryProvider>
