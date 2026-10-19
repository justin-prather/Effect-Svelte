<script lang="ts">
  import {
    provideRegistry,
    useAtom,
    useAtomSuspense,
    type Atom,
    type AtomRegistry,
    type AsyncResult
  } from "atom-svelte"
  import { untrack } from "svelte"

  const {
    count,
    result,
    registry
  }: {
    count: Atom.Writable<number, number>
    result: Atom.Atom<AsyncResult.AsyncResult<number>>
    registry: AtomRegistry.AtomRegistry
  } = $props()

  provideRegistry(untrack(() => registry))

  const writable = useAtom(() => count)
  const suspense = useAtomSuspense(() => result)
  const value = $derived(writable.current)
  const promise = $derived(suspense.current)

  export function readWritable() {
    return value
  }

  export function readSuspense() {
    return promise
  }
</script>
