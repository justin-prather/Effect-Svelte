<script lang="ts">
  import * as Option from "effect/Option"
  import type { FormSvelte } from "form-svelte"

  const {
    field,
    props
  }: FormSvelte.FieldComponentProps<string, { readonly placeholder?: string }> = $props()
</script>

<div>
  <input
    data-testid={field.path}
    value={field.value}
    placeholder={props.placeholder}
    oninput={(e) => field.onChange(e.currentTarget.value)}
    onblur={() => field.onBlur()}
  />
  {#if Option.isSome(field.error)}
    <span data-testid="{field.path}-error">{field.error.value}</span>
  {/if}
</div>
