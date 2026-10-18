import TextInput from "$lib/components/TextInput.svelte"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { Field, FormBuilder, FormSvelte } from "form-svelte"

const UsernameField = Field.makeField(
  "username",
  Schema.String.check(Schema.isMinLength(3, { message: "Username must be at least 3 characters" }))
)

const formBuilder = FormBuilder.empty.addField(UsernameField)

const fields = { username: TextInput }

export const onSubmitForm = FormSvelte.make(formBuilder, {
  mode: { validation: "onSubmit" },
  fields,
  onSubmit: () => Effect.log("Submitted (onSubmit mode)")
})

export const onBlurForm = FormSvelte.make(formBuilder, {
  mode: { validation: "onBlur" },
  fields,
  onSubmit: () => Effect.log("Submitted (onBlur mode)")
})

export const onChangeForm = FormSvelte.make(formBuilder, {
  mode: { validation: "onChange" },
  fields,
  onSubmit: () => Effect.log("Submitted (onChange mode)")
})

export const debouncedForm = FormSvelte.make(formBuilder, {
  mode: { validation: "onChange", debounce: "300 millis" },
  fields,
  onSubmit: () => Effect.log("Submitted (debounced mode)")
})

/** The four forms differ only in `mode`, so one card component renders any of them. */
export type ValidationModeForm = typeof onSubmitForm
