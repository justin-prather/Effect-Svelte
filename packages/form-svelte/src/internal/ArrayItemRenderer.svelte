<script lang="ts">
  import { useAtomSet } from "atom-svelte"
  import * as Option from "effect/Option"
  import { getContext, setContext, type Snippet } from "svelte"

  import { arrayItemContextKey, type ArrayItemContext } from "./context.js"
  import type { ArrayFieldRendererConfig } from "./types.js"

  const {
    config,
    props
  }: {
    config: ArrayFieldRendererConfig
    props: {
      readonly index: number
      readonly children?: Snippet<[{ readonly remove: () => void }]>
    }
  } = $props()

  const arrayCtx = getContext<ArrayItemContext | undefined>(arrayItemContextKey)
  const setFormState = useAtomSet(() => config.stateAtom)

  const parentPath = $derived(
    arrayCtx ? `${arrayCtx.parentPath}.${config.fieldKey}` : config.fieldKey
  )

  const itemPath = $derived(`${parentPath}[${props.index}]`)

  setContext<ArrayItemContext>(arrayItemContextKey, {
    get index() {
      return props.index
    },
    get parentPath() {
      return itemPath
    }
  })

  const remove = () => {
    setFormState((prev) =>
      Option.isNone(prev)
        ? prev
        : Option.some(config.operations.removeArrayItem(prev.value, parentPath, props.index))
    )
  }
</script>

{@render props.children?.({ remove })}
