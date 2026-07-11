<script lang="ts">
  import { Result, useAtomSet, useAtomValue } from "atom-svelte"
  import { profileForm as f } from "$lib/profile-form"

  const submit = useAtomSet(f.submit)
  const reset = useAtomSet(f.reset)
  const submitResult = useAtomValue(f.submit)
  const isDirty = useAtomValue(f.isDirty)
</script>

<f.Initialize defaultValues={{ name: "", email: "", links: [] }}>
  <form
    onsubmit={(e) => {
      e.preventDefault()
      submit()
    }}
  >
    <f.name label="Name" placeholder="Ada Lovelace" />
    <f.email label="Email" placeholder="ada@example.com" />

    <fieldset>
      <legend>Links</legend>
      <f.links>
        {#snippet children(ops)}
          {#each ops.items as _item, i (i)}
            <f.links.Item index={i}>
              {#snippet children({ remove })}
                <div class="link-row">
                  <f.links.url placeholder="https://…" />
                  <button type="button" onclick={remove}>remove</button>
                </div>
              {/snippet}
            </f.links.Item>
          {/each}
          <button type="button" onclick={() => ops.append({ url: "" })}>add link</button>
        {/snippet}
      </f.links>
    </fieldset>

    <p>
      <button type="submit" disabled={Result.isWaiting(submitResult.current)}>
        {Result.isWaiting(submitResult.current) ? "submitting…" : "submit"}
      </button>
      <button type="button" onclick={() => reset()}>reset</button>
      {#if isDirty.current}<em>unsaved changes</em>{/if}
    </p>
  </form>

  {#if Result.isSuccess(submitResult.current)}
    <h2>Submitted</h2>
    <pre>{JSON.stringify(submitResult.current.value, null, 2)}</pre>
  {:else if Result.isFailure(submitResult.current)}
    <p class="error">submit failed — fix the errors above and try again</p>
  {/if}
</f.Initialize>

<style>
  fieldset {
    margin-bottom: 0.75rem;
  }
  .link-row {
    display: flex;
    gap: 0.5rem;
    align-items: start;
  }
  .error {
    color: #c0392b;
  }
  pre {
    background: #f4f4f4;
    padding: 0.75rem;
    border-radius: 6px;
    overflow-x: auto;
  }
</style>
