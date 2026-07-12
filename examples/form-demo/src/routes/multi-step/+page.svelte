<script module lang="ts">
  import HiddenField from "$lib/components/HiddenField.svelte"
  import TextInput from "$lib/components/TextInput.svelte"
  import { Result, useAtomSet, useAtomSubscribe, useAtomValue } from "atom-svelte"
  import * as Effect from "effect/Effect"
  import * as Schema from "effect/Schema"
  import { Field, FormBuilder, FormSvelte } from "form-svelte"

  const required = (label: string) =>
    Schema.String.pipe(Schema.nonEmptyString({ message: () => `${label} is required` }))

  const step1Builder = FormBuilder.empty
    .addField(Field.makeField("firstName", required("First name")))
    .addField(Field.makeField("lastName", required("Last name")))

  const step1Form = FormSvelte.make(step1Builder, {
    mode: { validation: "onBlur" },
    fields: {
      firstName: TextInput,
      lastName: TextInput
    },
    onSubmit: (_, { decoded }) => Effect.succeed(decoded)
  })

  const step2Builder = FormBuilder.empty
    .addField(Field.makeField("street", required("Street")))
    .addField(Field.makeField("city", required("City")))
    .addField(Field.makeField("zip", required("ZIP code")))

  const step2Form = FormSvelte.make(step2Builder, {
    mode: { validation: "onBlur" },
    fields: {
      street: TextInput,
      city: TextInput,
      zip: TextInput
    },
    onSubmit: (_, { decoded }) => Effect.succeed(decoded)
  })

  const finalBuilder = FormBuilder.empty.merge(step1Builder).merge(step2Builder)

  const finalForm = FormSvelte.make(finalBuilder, {
    fields: {
      firstName: HiddenField,
      lastName: HiddenField,
      street: HiddenField,
      city: HiddenField,
      zip: HiddenField
    },
    onSubmit: (_, { decoded }) =>
      Effect.gen(function*() {
        yield* Effect.sleep("1 second")
        yield* Effect.log(`Order submitted for ${decoded.firstName} ${decoded.lastName}`)
        return { orderId: `ORD-${Date.now()}` }
      })
  })

  type Step1Data = { firstName: string; lastName: string }
  type Step2Data = { street: string; city: string; zip: string }
</script>

<script lang="ts">
  // React splits each step into its own component because hooks cannot be called
  // conditionally. Svelte has no such constraint, so all three steps live here and
  // only their markup is conditional.
  let currentStep = $state(1)
  let step1Data = $state<Step1Data | null>(null)
  let step2Data = $state<Step2Data | null>(null)

  const step1Submit = useAtomSet(step1Form.submit)
  const step1Result = useAtomValue(step1Form.submit)
  const step1IsDirty = useAtomValue(step1Form.isDirty)

  const step2Submit = useAtomSet(step2Form.submit)
  const step2Result = useAtomValue(step2Form.submit)
  const step2IsDirty = useAtomValue(step2Form.isDirty)

  const finalSubmit = useAtomSet(finalForm.submit)
  const finalResult = useAtomValue(finalForm.submit)

  useAtomSubscribe(
    step1Form.submit,
    (result) => {
      if (Result.isSuccess(result) && !result.waiting) {
        step1Data = result.value
        currentStep = 2
      }
    },
    { immediate: false }
  )

  useAtomSubscribe(
    step2Form.submit,
    (result) => {
      if (Result.isSuccess(result) && !result.waiting) {
        step2Data = result.value
        currentStep = 3
      }
    },
    { immediate: false }
  )

  // A step that is already valid and untouched has nothing to re-submit, so reuse
  // the previous success instead of re-running validation.
  const nextFromStep1 = () => {
    if (step1IsDirty.current) {
      step1Submit()
    } else if (Result.isSuccess(step1Result.current)) {
      step1Data = step1Result.current.value
      currentStep = 2
    }
  }

  const nextFromStep2 = () => {
    if (step2IsDirty.current) {
      step2Submit()
    } else if (Result.isSuccess(step2Result.current)) {
      step2Data = step2Result.current.value
      currentStep = 3
    }
  }

  const stepTitle = $derived(
    currentStep === 1 ? "Personal Info" : currentStep === 2 ? "Address" : "Review"
  )

  const orderId = $derived(
    Result.isSuccess(finalResult.current) ? finalResult.current.value.orderId : null
  )
</script>

<!-- Keeps each step's form state alive while its markup is unmounted. -->
<step1Form.KeepAlive />
<step2Form.KeepAlive />

<div class="pageContainerMedium">
  <h1 class="pageTitle">Multi-Step Wizard</h1>
  <p class="pageDescription">
    Three-step form using <code>.merge()</code> to combine builders. Each step validates
    independently, then merges into final form.
  </p>

  <div class="progressBar">
    {#each [1, 2, 3] as step (step)}
      <div class="progressStep" class:active={step <= currentStep}></div>
    {/each}
  </div>

  <div class="card">
    <h3 class="marginBottom16">Step {currentStep} of 3: {stepTitle}</h3>

    {#if currentStep === 1}
      <step1Form.Initialize defaultValues={{ firstName: "", lastName: "" }}>
        <form
          onsubmit={(e) => {
            e.preventDefault()
            nextFromStep1()
          }}
        >
          <step1Form.firstName label="First Name" />
          <step1Form.lastName label="Last Name" />
          <button type="submit" class="button" disabled={step1Result.current.waiting}>
            Next →
          </button>
        </form>
      </step1Form.Initialize>
    {:else if currentStep === 2}
      <step2Form.Initialize defaultValues={{ street: "", city: "", zip: "" }}>
        <form
          onsubmit={(e) => {
            e.preventDefault()
            nextFromStep2()
          }}
        >
          <step2Form.street label="Street Address" />
          <step2Form.city label="City" />
          <step2Form.zip label="ZIP Code" />
          <div class="buttonGroup">
            <button type="button" class="buttonSecondary" onclick={() => (currentStep = 1)}>
              ← Back
            </button>
            <button type="submit" class="button" disabled={step2Result.current.waiting}>
              Next →
            </button>
          </div>
        </form>
      </step2Form.Initialize>
    {:else}
      <finalForm.Initialize
        defaultValues={{
          firstName: step1Data?.firstName ?? "",
          lastName: step1Data?.lastName ?? "",
          street: step2Data?.street ?? "",
          city: step2Data?.city ?? "",
          zip: step2Data?.zip ?? ""
        }}
      >
        <form
          onsubmit={(e) => {
            e.preventDefault()
            finalSubmit()
          }}
        >
          <finalForm.firstName />
          <finalForm.lastName />
          <finalForm.street />
          <finalForm.city />
          <finalForm.zip />

          <div class="reviewSection">
            <h3 class="reviewTitle">Review Your Order</h3>
            <div class="grid2Col gridGap16">
              <div>
                <strong>Personal Info</strong>
                <p class="reviewItem">{step1Data?.firstName} {step1Data?.lastName}</p>
              </div>
              <div>
                <strong>Shipping Address</strong>
                <p class="reviewItem">{step2Data?.street}</p>
                <p class="reviewItem">{step2Data?.city}, {step2Data?.zip}</p>
              </div>
            </div>
          </div>

          {#if orderId !== null}
            <div class="alertSuccess marginBottom16">
              Order submitted! Order ID: <strong>{orderId}</strong>
            </div>
          {/if}

          <div class="buttonGroup">
            <button
              type="button"
              class="buttonSecondary"
              disabled={finalResult.current.waiting}
              onclick={() => (currentStep = 2)}
            >
              ← Back
            </button>
            <button type="submit" class="button" disabled={finalResult.current.waiting}>
              {finalResult.current.waiting ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </form>
      </finalForm.Initialize>
    {/if}
  </div>
</div>
