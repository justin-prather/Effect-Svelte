<script lang="ts">
  import type { FieldState as FieldStateModule } from "@lucas-barake/effect-form"
  import { getNestedValue } from "@lucas-barake/effect-form/Path"
  import { useAtom } from "atom-svelte"
  import * as Option from "effect/Option"
  import { getContext, type Snippet } from "svelte"

  import { arrayItemContextKey, type ArrayItemContext } from "./context.js"
  import type { ArrayFieldRendererConfig } from "./types.js"

  const {
    config,
    props
  }: {
    config: ArrayFieldRendererConfig
    props: { readonly children: Snippet<[FieldStateModule.ArrayFieldOperations<any>]> }
  } = $props()

  const arrayCtx = getContext<ArrayItemContext | undefined>(arrayItemContextKey)

  const state = useAtom(() => config.stateAtom)

  const fieldPath = $derived(
    arrayCtx ? `${arrayCtx.parentPath}.${config.fieldKey}` : config.fieldKey
  )

  const items = $derived.by(() => {
    const formState = Option.getOrThrow(state.current)

    // SAFETY: This renderer is created only for array fields; form operations preserve the array at fieldPath.
    return (getNestedValue(formState.values, fieldPath) ?? []) as ReadonlyArray<any>
  })

  const ops: FieldStateModule.ArrayFieldOperations<any> = {
    get items() {
      return items
    },
    append: (value?) => {
      state.set((prev) =>
        Option.isNone(prev)
          ? prev
          : Option.some(
              config.operations.appendArrayItem(prev.value, fieldPath, config.itemSchema, value)
            )
      )
    },
    remove: (index) => {
      state.set((prev) =>
        Option.isNone(prev)
          ? prev
          : Option.some(config.operations.removeArrayItem(prev.value, fieldPath, index))
      )
    },
    swap: (indexA, indexB) => {
      state.set((prev) =>
        Option.isNone(prev)
          ? prev
          : Option.some(config.operations.swapArrayItems(prev.value, fieldPath, indexA, indexB))
      )
    },
    move: (from, to) => {
      state.set((prev) =>
        Option.isNone(prev)
          ? prev
          : Option.some(config.operations.moveArrayItem(prev.value, fieldPath, from, to))
      )
    }
  }
</script>

{@render props.children?.(ops)}
