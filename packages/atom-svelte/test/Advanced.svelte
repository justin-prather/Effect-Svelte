<script lang="ts">
  import {
    useAtom,
    useAtomInitialValues,
    useAtomRef,
    useAtomSet,
    useAtomSubscribe,
    useAtomSuspense,
    useAtomValue,
    type Atom,
    type AtomRef,
    type AsyncResult
  } from "atom-svelte"

  const {
    atom,
    result,
    ref,
    initial = 7,
    onChange = () => {}
  }: {
    atom: Atom.Writable<number>
    result: Atom.Writable<AsyncResult.AsyncResult<number, string>, number>
    ref: AtomRef.AtomRef<number>
    initial?: number
    onChange?: (value: number) => void
  } = $props()

  // Initial values intentionally apply only during component initialization.
  // svelte-ignore state_referenced_locally
  useAtomInitialValues([[atom, initial]])

  const value = useAtomValue(() => atom)
  const reference = useAtomRef(() => ref)

  useAtomSubscribe(
    () => atom,
    (value) => onChange(value),
    { immediate: true }
  )

  const suspense = useAtomSuspense(() => result)
  const included = useAtomSuspense(() => result, { includeFailure: true })
  const writable = useAtom(() => result)

  export const writeCurrent = (value: number) => {
    writable.current = value
  }

  export const readCurrent = () => writable.current
  export const run = useAtomSet(() => result, { mode: "promise" })
  export const runExit = useAtomSet(() => result, { mode: "promiseExit" })
  export const pending = () => suspense.current
  export const withFailure = () => included.current
</script>

<span data-testid="value">{value.current}</span>
<span data-testid="ref">{reference.current}</span>
