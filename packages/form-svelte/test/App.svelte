<script lang="ts">
  import { useAtomSet } from "atom-svelte"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  import TextInput from "./TextInput.svelte"

  const {
    onSubmitSpy
  }: {
    onSubmitSpy: (decoded: {
      readonly name: string
      readonly tags: ReadonlyArray<{ readonly label: string }>
    }) => void
  } = $props()

  const builder = FormBuilder.empty
    .addField("name", Schema.NonEmptyString)
    .addField(Field.makeArrayField("tags", Schema.Struct({ label: Schema.String })))

  // svelte-ignore state_referenced_locally
  const f = FormSvelte.make(builder, {
    fields: {
      name: TextInput,
      tags: { label: TextInput }
    },
    onSubmit: (_args, { decoded }) => {
      onSubmitSpy(decoded)
    }
  })

  const submit = useAtomSet(f.submit)
</script>

<f.Initialize defaultValues={{ name: "Ada", tags: [] }}>
  <f.name placeholder="Your name" />
  <f.tags>
    {#snippet children(ops)}
      <button data-testid="append" onclick={() => ops.append({ label: "" })}>append</button>
      {#each ops.items as _item, i (i)}
        <f.tags.Item index={i}>
          {#snippet children({ remove })}
            <f.tags.label />
            <button data-testid="remove-{i}" onclick={remove}>remove</button>
          {/snippet}
        </f.tags.Item>
      {/each}
    {/snippet}
  </f.tags>
  <button data-testid="submit" onclick={() => submit()}>submit</button>
</f.Initialize>
