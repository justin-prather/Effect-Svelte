<script module lang="ts">
  import Checkbox from "$lib/components/Checkbox.svelte"
  import TextInput from "$lib/components/TextInput.svelte"
  import { useAtomSet, useAtomValue } from "atom-svelte"
  import * as Effect from "effect/Effect"
  import * as Option from "effect/Option"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  const TodosField = Field.makeArrayField(
    "todos",
    Schema.Struct({
      text: Schema.String.pipe(Schema.nonEmptyString({ message: () => "Todo text is required" })),
      completed: Schema.Boolean
    })
  )

  const todoFormBuilder = FormBuilder.empty.addField(TodosField)

  const todoForm = FormSvelte.make(todoFormBuilder, {
    fields: {
      todos: {
        text: TextInput,
        completed: Checkbox
      }
    },
    onSubmit: (_, { decoded }) =>
      Effect.gen(function*() {
        yield* Effect.log(`Submitting ${decoded.todos.length} todos`)
        return { count: decoded.todos.length }
      })
  })
</script>

<script lang="ts">
  const submit = useAtomSet(todoForm.submit)
  const submitResult = useAtomValue(todoForm.submit)
  const isDirty = useAtomValue(todoForm.isDirty)
  const values = useAtomValue(todoForm.values)
</script>

<div class="pageContainerMedium">
  <h1 class="pageTitle">Array Fields</h1>
  <p class="pageDescription">
    Dynamic list with <code>append</code>, <code>remove</code>, <code>swap</code>, and
    <code>move</code> operations.
  </p>

  <todoForm.Initialize defaultValues={{ todos: [] }}>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <todoForm.todos>
        {#snippet children({ append, items, move, swap })}
          {#if items.length === 0}
            <p class="emptyState">No todos yet. Add one below!</p>
          {/if}

          {#each items as _item, index (index)}
            <todoForm.todos.Item {index}>
              {#snippet children({ remove })}
                <div class="listItem">
                  <todoForm.todos.completed />
                  <todoForm.todos.text inline placeholder="What needs to be done?" />
                  <button type="button" class="buttonDanger buttonSmall" onclick={remove}>
                    Remove
                  </button>
                </div>
              {/snippet}
            </todoForm.todos.Item>
          {/each}

          <div class="buttonGroup marginTop16">
            <button
              type="button"
              class="buttonSuccess"
              onclick={() => append({ text: "", completed: false })}
            >
              Add Todo
            </button>

            {#if items.length >= 2}
              <button type="button" class="buttonIndigo" onclick={() => swap(0, 1)}>
                Swap 0 ↔ 1
              </button>
              <button
                type="button"
                class="buttonPurple"
                onclick={() => move(0, items.length - 1)}
              >
                Move first → last
              </button>
            {/if}
          </div>
        {/snippet}
      </todoForm.todos>

      <div class="marginTop24">
        <button
          type="submit"
          class="button"
          disabled={!isDirty.current || submitResult.current.waiting}
        >
          {submitResult.current.waiting ? "Saving..." : "Save Todos"}
        </button>
      </div>

      <div class="debugBox">
        <strong>Form Values:</strong>
        <pre class="debugPre">{JSON.stringify(Option.getOrNull(values.current), null, 2)}</pre>
      </div>
    </form>
  </todoForm.Initialize>
</div>
