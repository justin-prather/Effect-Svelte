# form-svelte

Svelte 5 bindings for [`@lucas-barake/effect-form`](https://github.com/lucas-barake/effect-form),
mirroring the API of `@lucas-barake/effect-form-react`.

Requires Effect `^4.0.5`, effect-form `^1.1.1`, Svelte 5, and the matching `atom-svelte` workspace package.

## Migration from Effect v3

Schemas use the Effect v4 API. For example, use `Schema.String.check(Schema.isMinLength(3))` for a minimum length.
Refinement errors use `{ path, issue }` instead of `{ path, message }`.
Submission validation fails with `Schema.SchemaError`, not `ParseResult.ParseError`.
Form schemas expose `Schema.Codec` types, with separate encoded and decoded values.

`onSubmit` accepts a value, a `PromiseLike`, or an Effect.
The optional `submitErrors` callback maps typed submission errors to `{ path, message }` entries.
Declare `submitErrors` after `onSubmit` so TypeScript can infer the error type.
The `fieldErrors` atom exposes a `ReadonlyMap` from field paths to messages.

## Usage

Field components receive `{ field, props }`:

```svelte
<!-- TextInput.svelte -->
<script lang="ts">
  import * as Option from "effect/Option"
  import type { FormSvelte } from "form-svelte"

  const { field, props }: FormSvelte.FieldComponentProps<string, { placeholder?: string }> =
    $props()
</script>

<input
  value={field.value}
  placeholder={props.placeholder}
  oninput={(e) => field.onChange(e.currentTarget.value)}
  onblur={() => field.onBlur()}
/>
{#if Option.isSome(field.error)}<span>{field.error.value}</span>{/if}
```

Build the form and render the generated components:

```svelte
<script lang="ts">
  import { useAtomSet } from "atom-svelte"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"
  import TextInput from "./TextInput.svelte"

  const builder = FormBuilder.empty
    .addField("name", Schema.NonEmptyString)
    .addField(Field.makeArrayField("tags", Schema.Struct({ label: Schema.String })))

  const f = FormSvelte.make(builder, {
    fields: { name: TextInput, tags: { label: TextInput } },
    onSubmit: (_args, { decoded }) => console.log(decoded)
  })

  const submit = useAtomSet(f.submit)
</script>

<f.Initialize defaultValues={{ name: "", tags: [] }}>
  <f.name placeholder="Your name" />
  <f.tags>
    {#snippet children(ops)}
      <button onclick={() => ops.append({ label: "" })}>add tag</button>
      {#each ops.items as _item, i (i)}
        <f.tags.Item index={i}>
          {#snippet children({ remove })}
            <f.tags.label />
            <button onclick={remove}>remove</button>
          {/snippet}
        </f.tags.Item>
      {/each}
    {/snippet}
  </f.tags>
  <button onclick={() => submit()}>submit</button>
</f.Initialize>
```

`FormSvelte.make` also returns the same atoms as the React bindings (`values`, `isDirty`, `submit`,
`validate`, `reset`, `setValues`, `getFieldAtoms`, `mount`, `KeepAlive`, …) — read/write them with
the `atom-svelte` hooks.

## Differences from form-react

- Render-prop children become snippets: array fields take `{#snippet children(ops)}`, and `Item`
  passes `{ remove }` to its snippet.
- `field` state properties (`value`, `error`, `isTouched`, `isValidating`, `isDirty`, `path`) are
  reactive getters — read them where you use them.
- `Initialize` initializes synchronously, so children render on the first pass (no
  `isInitialized` effect dance).
- `Initialize` uses the upstream initialization atom to clear previous validation and submission state.
  `KeepAlive` preserves form state across remounts.
