<script lang="ts">
  import ValidationModeCard from "$lib/components/ValidationModeCard.svelte"
  import {
    debouncedForm,
    onBlurForm,
    onChangeForm,
    onSubmitForm
  } from "$lib/forms/validation-modes"
</script>

<div class="pageContainerMedium">
  <h1 class="pageTitle">Validation Modes</h1>
  <p class="pageDescription">
    Different validation timing strategies. Type less than 3 characters to see errors.
  </p>

  <ValidationModeCard
    title="onSubmit"
    description="Errors show only after clicking Submit"
    form={onSubmitForm}
  />

  <ValidationModeCard
    title="onBlur"
    description="Errors show after leaving the field (blur)"
    form={onBlurForm}
  />

  <ValidationModeCard
    title="onChange"
    description="Errors show immediately on every keystroke"
    form={onChangeForm}
  />

  <ValidationModeCard
    title="Debounced (300ms)"
    description="Errors show 300ms after you stop typing"
    form={debouncedForm}
  />
</div>
