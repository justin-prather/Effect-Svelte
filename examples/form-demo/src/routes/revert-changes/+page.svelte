<script module lang="ts">
  import TextInput from "$lib/components/TextInput.svelte"
  import { Result, useAtomSet, useAtomValue } from "atom-svelte"
  import * as Effect from "effect/Effect"
  import * as Option from "effect/Option"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  const NameField = Field.makeField(
    "name",
    Schema.String.pipe(Schema.nonEmptyString({ message: () => "Name is required" }))
  )

  const EmailField = Field.makeField(
    "email",
    Schema.String.pipe(Schema.nonEmptyString({ message: () => "Email is required" }))
  )

  const profileFormBuilder = FormBuilder.empty.addField(NameField).addField(EmailField)

  const profileForm = FormSvelte.make(profileFormBuilder, {
    mode: { validation: "onBlur" },
    fields: {
      name: TextInput,
      email: TextInput
    },
    onSubmit: (_, { decoded }) =>
      Effect.gen(function*() {
        yield* Effect.sleep("500 millis")
        yield* Effect.log(`Profile updated: ${decoded.name}`)
        return { savedAt: new Date() }
      })
  })
</script>

<script lang="ts">
  const submit = useAtomSet(profileForm.submit)
  const reset = useAtomSet(profileForm.reset)
  const revertToLastSubmit = useAtomSet(profileForm.revertToLastSubmit)

  const submitResult = useAtomValue(profileForm.submit)
  const isDirty = useAtomValue(profileForm.isDirty)
  const hasChangedSinceSubmit = useAtomValue(profileForm.hasChangedSinceSubmit)
  const submitCount = useAtomValue(profileForm.submitCount)
  const values = useAtomValue(profileForm.values)
  const lastSubmittedValues = useAtomValue(profileForm.lastSubmittedValues)

  const status = $derived(
    Result.builder(submitResult.current)
      .onWaiting(() => ({ tone: "alertInfo", message: "Saving..." }))
      .onSuccess((value) => ({
        tone: "alertSuccess alertSmall marginTop16",
        message: `Last saved at ${value.savedAt.toLocaleTimeString()}`
      }))
      .orNull()
  )
</script>

<div class="pageContainerMedium">
  <h1 class="pageTitle">Revert Changes</h1>
  <p class="pageDescription">
    Track changes since last submit with <code>hasChangedSinceSubmit</code> and
    <code>revertToLastSubmit</code>. Shows an "unsaved changes" banner when the form differs from
    the last submitted state.
  </p>

  <profileForm.Initialize defaultValues={{ name: "John Doe", email: "john@example.com" }}>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {#if hasChangedSinceSubmit.current}
        <div class="unsavedBanner">
          <span>You have unsaved changes</span>
          <button type="button" class="buttonWarning" onclick={() => revertToLastSubmit()}>
            Revert Changes
          </button>
        </div>
      {/if}

      <profileForm.name label="Name" />
      <profileForm.email label="Email" />

      <div class="inlineFlex">
        <button
          type="submit"
          class="button"
          disabled={!isDirty.current || submitResult.current.waiting}
        >
          {submitResult.current.waiting ? "Saving..." : "Save Profile"}
        </button>
        <button
          type="button"
          class="buttonSecondary"
          disabled={!isDirty.current}
          onclick={() => reset()}
        >
          Reset to Initial
        </button>
      </div>

      {#if status !== null}
        <div class={status.tone}>{status.message}</div>
      {/if}

      <div class="debugBox">
        <strong>Form State:</strong>
        <div class="grid2Col gridGap16 marginTop16">
          <div>
            <div class="stateLabel">Current Values:</div>
            <pre class="statePre">{JSON.stringify(Option.getOrNull(values.current), null, 2)}</pre>
          </div>
          <div>
            <div class="stateLabel">Last Submitted:</div>
            <pre class="statePre">{JSON.stringify(
                Option.getOrNull(lastSubmittedValues.current),
                null,
                2
              )}</pre>
          </div>
        </div>
        <div class="stateFlags">
          <span>isDirty: <strong>{isDirty.current}</strong></span>
          <span>hasChangedSinceSubmit: <strong>{hasChangedSinceSubmit.current}</strong></span>
          <span>submitCount: <strong>{submitCount.current}</strong></span>
        </div>
      </div>
    </form>
  </profileForm.Initialize>
</div>
