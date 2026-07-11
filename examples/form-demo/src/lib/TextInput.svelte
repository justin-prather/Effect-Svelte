<script lang="ts">
  import * as Option from "effect/Option"
  import type { FormSvelte } from "form-svelte"

  const {
    field,
    props
  }: FormSvelte.FieldComponentProps<
    string,
    { readonly label?: string; readonly placeholder?: string }
  > = $props()
</script>

<label>
  {#if props.label}<span>{props.label}</span>{/if}
  <input
    value={field.value}
    placeholder={props.placeholder}
    class:invalid={Option.isSome(field.error)}
    oninput={(e) => field.onChange(e.currentTarget.value)}
    onblur={() => field.onBlur()}
  />
  {#if field.isValidating}
    <small>validating…</small>
  {:else if Option.isSome(field.error)}
    <small class="error">{field.error.value}</small>
  {/if}
</label>

<style>
  label {
    display: block;
    margin-bottom: 0.75rem;
  }
  label > span {
    display: block;
    font-weight: 600;
    font-size: 0.85rem;
  }
  input.invalid {
    border-color: #c0392b;
    outline-color: #c0392b;
  }
  .error {
    color: #c0392b;
    display: block;
  }
</style>
