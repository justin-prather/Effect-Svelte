import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { Field, FormBuilder, FormSvelte } from "form-svelte"
import TextInput from "./TextInput.svelte"

const Email = Schema.String.pipe(
  Schema.pattern(/^\S+@\S+\.\S+$/),
  Schema.annotations({ message: () => "must be a valid email address" })
)

const Name = Schema.NonEmptyString.annotations({ message: () => "name is required" })

const builder = FormBuilder.empty
  .addField("name", Name)
  .addField("email", Email)
  .addField(Field.makeArrayField("links", Schema.Struct({ url: Schema.NonEmptyString })))

export const profileForm = FormSvelte.make(builder, {
  fields: {
    name: TextInput,
    email: TextInput,
    links: { url: TextInput }
  },
  mode: { validation: "onBlur" },
  onSubmit: (_args, { decoded }) =>
    // pretend to hit an API, then hand the decoded values to the submit Result
    Effect.succeed(decoded).pipe(Effect.delay("400 millis"))
})
