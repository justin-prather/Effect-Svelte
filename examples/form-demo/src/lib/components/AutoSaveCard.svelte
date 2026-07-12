<script lang="ts">
  import type { AutoSubmitForm } from "$lib/forms/auto-submit"
  import { Result, useAtomValue } from "atom-svelte"

  const {
    defaultValues,
    description,
    form,
    title
  }: {
    readonly title: string
    readonly description: string
    readonly form: AutoSubmitForm
    readonly defaultValues: { readonly displayName: string; readonly bio: string }
  } = $props()

  const submitResult = useAtomValue(() => form.submit)

  const status = $derived(
    Result.builder(submitResult.current)
      .onWaiting(() => ({ tone: "alertWarning", message: "Saving..." }))
      .onSuccess((value) => ({
        tone: "alertSuccess",
        message: `Saved at ${value.savedAt.toLocaleTimeString()}`
      }))
      .onError(() => ({ tone: "alertError", message: "Failed to save" }))
      .orNull()
  )
</script>

<div class="card">
  <h3 class="cardTitle">{title}</h3>
  <p class="cardDescription">{description}</p>

  <form.Initialize {defaultValues}>
    <form.displayName label="Display Name" />
    <form.bio label="Bio" />
    {#if status !== null}
      <div class="{status.tone} alertSmall">{status.message}</div>
    {/if}
  </form.Initialize>
</div>
