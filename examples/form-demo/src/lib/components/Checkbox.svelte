<script lang="ts">
  import type { FormSvelte } from "form-svelte"

  const { field }: FormSvelte.FieldComponentProps<boolean> = $props()
</script>

<input
  type="checkbox"
  class="checkbox"
  checked={field.value}
  onchange={(e) => field.onChange(e.currentTarget.checked)}
/>
