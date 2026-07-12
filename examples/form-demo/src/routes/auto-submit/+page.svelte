<script lang="ts">
  import AutoSaveCard from "$lib/components/AutoSaveCard.svelte"
  import { autoSubmitOnBlurForm, autoSubmitOnChangeForm } from "$lib/forms/auto-submit"
</script>

<div class="pageContainerLarge">
  <h1 class="pageTitle">Auto-Submit</h1>
  <p class="pageDescription">
    Forms that automatically save when you make changes. No submit button needed!
  </p>

  <div class="grid2Col">
    <AutoSaveCard
      title="Auto-save on Change"
      description="Saves 500ms after you stop typing"
      form={autoSubmitOnChangeForm}
      defaultValues={{ displayName: "John", bio: "Hello!" }}
    />

    <AutoSaveCard
      title="Auto-save on Blur"
      description="Saves when you leave a field"
      form={autoSubmitOnBlurForm}
      defaultValues={{ displayName: "Jane", bio: "Hi there!" }}
    />
  </div>
</div>
