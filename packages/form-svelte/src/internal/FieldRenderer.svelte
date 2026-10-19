<script lang="ts" generics="P extends Record<string, unknown>">
  import { useAtom, useAtomMount, useAtomSet, useAtomValue } from "atom-svelte"
  import { getContext } from "svelte"

  import { arrayItemContextKey, type ArrayItemContext } from "./context.js"
  import type { FieldRendererConfig } from "./types.js"

  const { config, props }: { config: FieldRendererConfig<P>; props: P } = $props()

  const arrayCtx = getContext<ArrayItemContext | undefined>(arrayItemContextKey)

  const fieldPath = $derived(
    arrayCtx ? `${arrayCtx.parentPath}.${config.fieldKey}` : config.fieldKey
  )

  const fieldAtoms = $derived(config.getOrCreateFieldAtoms(fieldPath, config.schema))

  const value = useAtom(() => fieldAtoms.valueAtom)
  const touched = useAtom(() => fieldAtoms.touchedAtom)
  const displayError = useAtomValue(() => fieldAtoms.displayErrorAtom)
  const isDirty = useAtomValue(() => fieldAtoms.isDirtyAtom)
  const validation = useAtomValue(() => fieldAtoms.validationAtom)
  const setOnBlurSubmit = useAtomSet(() => config.onBlurSubmitAtom)

  useAtomMount(() => fieldAtoms.triggerValidationAtom)

  const field = {
    get path() {
      return fieldPath
    },
    get value() {
      return value.current
    },
    onChange: (newValue: Parameters<typeof value.set>[0]) => {
      value.set(newValue)
    },
    onBlur: () => {
      touched.set(true)
      setOnBlurSubmit()
    },
    get error() {
      return displayError.current
    },
    get isTouched() {
      return touched.current
    },
    get isValidating() {
      return validation.current.waiting
    },
    get isDirty() {
      return isDirty.current
    }
  }
</script>

<config.component {field} {props} />
