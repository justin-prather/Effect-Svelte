<script lang="ts">
  import * as Option from "effect/Option"
  import type { FormSvelte } from "form-svelte"

  // Upstream defines a bespoke input component per field (EmailInput, PasswordInput, …).
  // A single component with extra props covers all of them here, and exercises the
  // extra-props inference that makes `<login.email label="Email" />` typecheck.
  const {
    field,
    props
  }: FormSvelte.FieldComponentProps<
    string,
    {
      readonly label?: string
      readonly type?: "text" | "email" | "password"
      readonly placeholder?: string
      readonly validatingText?: string
      /** Render as a bare input for use inside an array-field row. */
      readonly inline?: boolean
      /** Show the `*` marker while the field differs from its initial value. */
      readonly showDirty?: boolean
    }
  > = $props()

  const validatingText = $derived(props.validatingText ?? "Validating...")
</script>

{#if props.inline}
  <input
    type={props.type ?? "text"}
    value={field.value}
    placeholder={props.placeholder}
    class="listItemInput"
    class:error={Option.isSome(field.error)}
    oninput={(e) => field.onChange(e.currentTarget.value)}
    onblur={() => field.onBlur()}
  />
{:else}
  <div class="fieldContainer">
    {#if props.label}
      <label class="label" for={field.path}>
        {props.label}
        {#if props.showDirty && field.isDirty}<span class="dirtyIndicator">*</span>{/if}
      </label>
    {/if}
    <input
      id={field.path}
      type={props.type ?? "text"}
      value={field.value}
      placeholder={props.placeholder}
      class="input"
      class:error={Option.isSome(field.error)}
      oninput={(e) => field.onChange(e.currentTarget.value)}
      onblur={() => field.onBlur()}
    />
    {#if field.isValidating}
      <span class="validatingText">{validatingText}</span>
    {/if}
    {#if Option.isSome(field.error)}
      <span class="errorText">{field.error.value}</span>
    {/if}
  </div>
{/if}
