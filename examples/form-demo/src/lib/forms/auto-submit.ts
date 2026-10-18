import TextInput from "$lib/components/TextInput.svelte"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import { Field, FormBuilder, FormSvelte } from "form-svelte"

const DisplayNameField = Field.makeField(
  "displayName",
  Schema.String.check(Schema.isNonEmpty({ message: "Display name is required" }))
)

const BioField = Field.makeField("bio", Schema.String)

const settingsFormBuilder = FormBuilder.empty.addField(DisplayNameField).addField(BioField)

const fields = { displayName: TextInput, bio: TextInput }

const save = (label: string) => (_: void, { decoded }: { readonly decoded: { readonly displayName: string } }) =>
  Effect.gen(function*() {
    yield* Effect.sleep("300 millis")
    yield* Effect.log(`${label}: ${decoded.displayName}`)
    return { savedAt: new Date() }
  })

export const autoSubmitOnChangeForm = FormSvelte.make(settingsFormBuilder, {
  mode: { validation: "onChange", debounce: "500 millis", autoSubmit: true },
  fields,
  onSubmit: save("Auto-saved")
})

export const autoSubmitOnBlurForm = FormSvelte.make(settingsFormBuilder, {
  mode: { validation: "onBlur", autoSubmit: true },
  fields,
  onSubmit: save("Auto-saved on blur")
})

/** Both forms submit the same shape, so one card component renders either. */
export type AutoSubmitForm = typeof autoSubmitOnChangeForm
