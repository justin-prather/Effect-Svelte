<script lang="ts">
  import type { ValidationModeForm } from "$lib/forms/validation-modes"
  import { useAtomSet, useAtomValue } from "atom-svelte"

  const {
    description,
    form,
    title
  }: {
    readonly title: string
    readonly description: string
    readonly form: ValidationModeForm
  } = $props()

  // `form` is a prop, so the atoms are read through thunks — the hooks re-resolve
  // them if the prop ever changes.
  const isDirty = useAtomValue(() => form.isDirty)
  const submitResult = useAtomValue(() => form.submit)
  const submit = useAtomSet(() => form.submit)
</script>

<div class="card marginBottom16">
  <h3 class="cardTitle">{title}</h3>
  <p class="cardDescription">{description}</p>

  <form.Initialize defaultValues={{ username: "" }}>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <form.username label="Username" />
      <button
        type="submit"
        class="button buttonSmall"
        disabled={!isDirty.current || submitResult.current.waiting}
      >
        Submit
      </button>
    </form>
  </form.Initialize>
</div>
