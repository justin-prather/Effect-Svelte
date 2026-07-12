<script module lang="ts">
  import TextInput from "$lib/components/TextInput.svelte"
  import { useAtomSet, useAtomValue } from "atom-svelte"
  import * as Effect from "effect/Effect"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  const PasswordField = Field.makeField(
    "password",
    Schema.String.pipe(Schema.minLength(8, { message: () => "Password must be at least 8 characters" }))
  )

  const ConfirmPasswordField = Field.makeField(
    "confirmPassword",
    Schema.String.pipe(Schema.nonEmptyString({ message: () => "Please confirm your password" }))
  )

  const signupFormBuilder = FormBuilder.empty
    .addField(PasswordField)
    .addField(ConfirmPasswordField)
    .refine((values) => {
      if (values.password !== values.confirmPassword) {
        return { path: ["confirmPassword"], message: "Passwords must match" }
      }
    })

  const signupForm = FormSvelte.make(signupFormBuilder, {
    mode: { validation: "onBlur" },
    fields: {
      password: TextInput,
      confirmPassword: TextInput
    },
    onSubmit: () =>
      Effect.gen(function*() {
        yield* Effect.sleep("500 millis")
        yield* Effect.log("Password set for signup")
        return { success: true }
      })
  })
</script>

<script lang="ts">
  const submit = useAtomSet(signupForm.submit)
  const submitResult = useAtomValue(signupForm.submit)
  const isDirty = useAtomValue(signupForm.isDirty)
</script>

<div class="pageContainer">
  <h1 class="pageTitle">Cross-Field Validation</h1>
  <p class="pageDescription">
    Using <code>.refine()</code> for synchronous cross-field validation. Error is routed to the
    <code>confirmPassword</code> field.
  </p>

  <signupForm.Initialize defaultValues={{ password: "", confirmPassword: "" }}>
    <form
      onsubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <signupForm.password label="Password" type="password" />
      <signupForm.confirmPassword label="Confirm Password" type="password" />

      <button
        type="submit"
        class="button"
        disabled={!isDirty.current || submitResult.current.waiting}
      >
        {submitResult.current.waiting ? "Setting Password..." : "Set Password"}
      </button>
    </form>
  </signupForm.Initialize>
</div>
