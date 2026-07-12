<script module lang="ts">
  import TextInput from "$lib/components/TextInput.svelte"
  import { Atom, useAtomSet, useAtomValue } from "atom-svelte"
  import * as Context from "effect/Context"
  import * as Effect from "effect/Effect"
  import * as Layer from "effect/Layer"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  class UsernameValidator extends Context.Tag("UsernameValidator")<
    UsernameValidator,
    { readonly isTaken: (username: string) => Effect.Effect<boolean> }
  >() {}

  const UsernameValidatorLive = Layer.succeed(UsernameValidator, {
    isTaken: (username) =>
      Effect.gen(function*() {
        yield* Effect.sleep("800 millis")
        const reserved = ["admin", "root", "taken"]
        return reserved.includes(username.toLowerCase())
      })
  })

  const runtime = Atom.runtime(UsernameValidatorLive)

  const UsernameField = Field.makeField(
    "username",
    Schema.String.pipe(
      Schema.minLength(3, { message: () => "Username must be at least 3 characters" }),
      Schema.pattern(/^[a-zA-Z0-9_]+$/, { message: () => "Only letters, numbers, and underscores" })
    )
  )

  const usernameFormBuilder = FormBuilder.empty.addField(UsernameField).refineEffect((values) =>
    Effect.gen(function*() {
      const validator = yield* UsernameValidator
      const isTaken = yield* validator.isTaken(values.username)
      if (isTaken) {
        return { path: ["username"], message: "This username is already taken" }
      }
    })
  )

  const usernameForm = FormSvelte.make(usernameFormBuilder, {
    runtime,
    mode: { validation: "onChange", debounce: "300 millis" },
    fields: { username: TextInput },
    onSubmit: (_, { decoded }) =>
      Effect.gen(function*() {
        yield* Effect.sleep("500 millis")
        yield* Effect.log(`Username registered: ${decoded.username}`)
        return { username: decoded.username }
      })
  })
</script>

<script lang="ts">
  const submit = useAtomSet(usernameForm.submit)
  const submitResult = useAtomValue(usernameForm.submit)
  const isDirty = useAtomValue(usernameForm.isDirty)
</script>

<div class="pageContainer">
  <h1 class="pageTitle">Async Validation</h1>
  <p class="pageDescription">
    Using <code>.refineEffect()</code> with Effect services. Validation runs asynchronously with
    debouncing.
  </p>
  <p class="pageHint">
    Reserved usernames: <code>admin</code>, <code>root</code>, <code>taken</code>
  </p>

  <usernameForm.Initialize defaultValues={{ username: "" }}>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <usernameForm.username label="Username" validatingText="Checking availability..." />

      <button
        type="submit"
        class="button"
        disabled={!isDirty.current || submitResult.current.waiting}
      >
        {submitResult.current.waiting ? "Registering..." : "Register"}
      </button>
    </form>
  </usernameForm.Initialize>
</div>
