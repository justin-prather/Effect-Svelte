<script module lang="ts">
  import TextInput from "$lib/components/TextInput.svelte"
  import { Result, useAtomSet, useAtomValue } from "atom-svelte"
  import * as Data from "effect/Data"
  import * as Effect from "effect/Effect"
  import * as Option from "effect/Option"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  class InvalidCredentialsError extends Data.TaggedError("InvalidCredentialsError")<{
    readonly email: string
  }> {}

  class AccountLockedError extends Data.TaggedError("AccountLockedError")<{
    readonly email: string
    readonly unlockAt: Date
  }> {}

  const EmailField = Field.makeField(
    "email",
    Schema.String.pipe(Schema.nonEmptyString({ message: () => "Email is required" }))
  )

  const PasswordField = Field.makeField(
    "password",
    Schema.String.pipe(Schema.minLength(8, { message: () => "Password must be at least 8 characters" }))
  )

  const loginFormBuilder = FormBuilder.empty.addField(EmailField).addField(PasswordField)

  const loginForm = FormSvelte.make(loginFormBuilder, {
    fields: {
      email: TextInput,
      password: TextInput
    },
    onSubmit: (_, { decoded }) =>
      Effect.gen(function*() {
        yield* Effect.sleep("500 millis")

        if (decoded.email === "locked@example.com") {
          return yield* new AccountLockedError({
            email: decoded.email,
            unlockAt: new Date(Date.now() + 1000 * 60 * 30)
          })
        }

        if (decoded.email === "invalid@example.com") {
          return yield* new InvalidCredentialsError({ email: decoded.email })
        }

        yield* Effect.log(`Login successful: ${decoded.email}`)
        return { email: decoded.email }
      })
  })

  // Upstream's `Result.builder` chain returns JSX directly. Here it folds the Result
  // into plain data and the markup renders it — the tag-level exhaustiveness is the same.
  type Alert = { readonly tone: "success" | "error" | "warning"; readonly message: string }

  const alert = (tone: Alert["tone"], message: string): Alert => ({ tone, message })

  const toneClass = {
    success: "alertSuccess",
    error: "alertError",
    warning: "alertWarning"
  } as const
</script>

<script lang="ts">
  const submit = useAtomSet(loginForm.submit)
  const submitResult = useAtomValue(loginForm.submit)
  const isDirty = useAtomValue(loginForm.isDirty)
  const submitCount = useAtomValue(loginForm.submitCount)
  const values = useAtomValue(loginForm.values)

  const status = $derived(
    Result.builder(submitResult.current)
      .onWaiting(() => null)
      .onSuccess((value) => alert("success", `Login successful! Welcome, ${value.email}`))
      .onErrorTag(
        "InvalidCredentialsError",
        (error) =>
          alert("error", `Invalid credentials for ${error.email}. Please check your email and password.`)
      )
      .onErrorTag(
        "AccountLockedError",
        (error) =>
          alert(
            "warning",
            `Account ${error.email} is locked. Try again at ${error.unlockAt.toLocaleTimeString()}.`
          )
      )
      .onErrorTag("ParseError", () => alert("error", "Please fix the validation errors above."))
      .onDefect((defect) => alert("error", `Unexpected error: ${String(defect)}`))
      .orNull()
  )

  const debugState = $derived({
    isDirty: isDirty.current,
    submitCount: submitCount.current,
    values: Option.getOrNull(values.current)
  })
</script>

<div class="pageContainer">
  <h1 class="pageTitle">Basic Form</h1>
  <p class="pageDescription">
    Simple login form with type-safe error handling using <code>Data.TaggedError</code> and
    <code>Result.builder()</code>.
  </p>
  <p class="pageHint">
    Try: <code>invalid@example.com</code> for credentials error,
    <code>locked@example.com</code> for account locked.
  </p>

  <loginForm.Initialize defaultValues={{ email: "", password: "" }}>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <loginForm.email label="Email" type="email" showDirty />
      <loginForm.password label="Password" type="password" showDirty />

      <button
        type="submit"
        class="button"
        disabled={!isDirty.current || submitResult.current.waiting}
      >
        {submitResult.current.waiting ? "Logging in..." : "Login"}
      </button>

      {#if status !== null}
        <div class={toneClass[status.tone]}>{status.message}</div>
      {/if}

      <div class="debugBox">
        <strong>Form State:</strong>
        <pre class="debugPre">{JSON.stringify(debugState, null, 2)}</pre>
      </div>
    </form>
  </loginForm.Initialize>
</div>
