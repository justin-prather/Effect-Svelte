<script lang="ts">
  import { useAtomSet, useAtomValue } from "atom-svelte"
  import * as Effect from "effect/Effect"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"
  import TextInput from "./TextInput.svelte"

  const { onSubmit = async (n: number) => n, validateOnInit = false, invalid = false, keepAlive = false }: {
    onSubmit?: (value: number) => PromiseLike<number> | Effect.Effect<number, string>
    validateOnInit?: boolean
    invalid?: boolean
    keepAlive?: boolean
  } = $props()

  const builder = FormBuilder.empty
    .addField("age", Schema.NumberFromString.check(Schema.isGreaterThan(0)))
    .addField(Field.makeArrayField("tags", Schema.suspend(() => Schema.Struct({ label: Schema.String }))))
  const f = FormSvelte.make(builder, {
    fields: { age: TextInput, tags: { label: TextInput } },
    onSubmit: (_args, { decoded }) => onSubmit(decoded.age),
    submitErrors: (message) => [{ path: "age", message }]
  })
  const errors = useAtomValue(f.fieldErrors)
  const dirty = useAtomValue(f.isDirty)
  const count = useAtomValue(f.submitCount)
  const values = useAtomValue(f.values)
  export const submit = useAtomSet(f.submit, { mode: "promiseExit" })
  export const reset = useAtomSet(f.reset)
  export const revert = useAtomSet(f.revertToLastSubmit)
  export const setValues = useAtomSet(f.setValues)
  export const getValues = () => values.current
  let visible = $state(true)
</script>

{#if keepAlive}<f.KeepAlive />{/if}
<button data-testid="toggle" onclick={() => visible = !visible}>toggle</button>
<span data-testid="errors">{errors.current.get("age") ?? ""}</span>
<span data-testid="dirty">{String(dirty.current)}</span>
<span data-testid="count">{count.current}</span>
{#if visible}
  <f.Initialize defaultValues={{ age: invalid ? "bad" : "21", tags: [{ label: "effect" }] }} {validateOnInit}>
    <f.age placeholder="Age" />
    <f.tags>
      {#snippet children(ops)}
        {#each ops.items as _, index}
          <f.tags.Item {index}><f.tags.label placeholder="Label" /></f.tags.Item>
        {/each}
      {/snippet}
    </f.tags>
  </f.Initialize>
{/if}
