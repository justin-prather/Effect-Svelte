<script lang="ts">
  import { countAtom, doubledAtom, greetAtom, quoteAtom } from "$lib/atoms"
  import { Result, useAtom, useAtomRefresh, useAtomSet, useAtomValue } from "atom-svelte"

  // --- counter: read + write, bind:, derived atom -------------------------
  const count = useAtom(countAtom)
  const doubled = useAtomValue(doubledAtom)

  // --- async atom: Result states + refresh --------------------------------
  const quote = useAtomValue(quoteAtom)
  const refreshQuote = useAtomRefresh(quoteAtom)

  // --- function atom: promise-mode setter ---------------------------------
  const greetResult = useAtomValue(greetAtom)
  const greet = useAtomSet(greetAtom, { mode: "promise" })

  let name = $state("world")
  let greeting = $state("")

  const onGreet = async () => {
    greeting = await greet(name)
  }
</script>

<section>
  <h2>Counter</h2>
  <p>
    <button onclick={() => count.set((n) => n - 1)}>-</button>
    <input type="number" bind:value={count.current} />
    <button onclick={() => count.set((n) => n + 1)}>+</button>
  </p>
  <p>doubled (derived atom): <strong>{doubled.current}</strong></p>
</section>

<section>
  <h2>Async atom</h2>
  {#if Result.isSuccess(quote.current)}
    <blockquote class:waiting={quote.current.waiting}>{quote.current.value}</blockquote>
  {:else if Result.isFailure(quote.current)}
    <p>failed to load</p>
  {:else}
    <p>loading…</p>
  {/if}
  <button onclick={refreshQuote}>another one</button>
</section>

<section>
  <h2>Function atom (promise mode)</h2>
  <p>
    <input bind:value={name} placeholder="your name" />
    <button onclick={onGreet} disabled={Result.isWaiting(greetResult.current)}>
      {Result.isWaiting(greetResult.current) ? "greeting…" : "greet"}
    </button>
  </p>
  {#if greeting}
    <p><strong>{greeting}</strong></p>
  {/if}
</section>

<style>
  section {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 0.25rem 1rem 1rem;
    margin-bottom: 1rem;
  }
  .waiting {
    opacity: 0.5;
  }
</style>
