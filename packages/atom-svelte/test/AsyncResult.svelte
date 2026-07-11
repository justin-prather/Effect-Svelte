<script lang="ts">
  import { Result, useAtomSet, useAtomValue, type Atom } from "atom-svelte"

  const { fnAtom }: { fnAtom: Atom.AtomResultFn<number, number> } = $props()

  const result = useAtomValue(() => fnAtom)
  const call = useAtomSet(() => fnAtom, { mode: "promise" })

  export const run = (n: number): Promise<number> => call(n)
</script>

<span data-testid="result">
  {Result.isSuccess(result.current) ? result.current.value : result.current._tag}
</span>
