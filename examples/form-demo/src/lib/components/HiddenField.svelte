<script lang="ts">
  import type { FormSvelte } from "form-svelte"

  // The wizard's final form owns the merged values but renders none of them, so its
  // field map needs components that draw no UI — the equivalent of upstream's `constNull`.
  const { field }: FormSvelte.FieldComponentProps<string> = $props()
</script>

<input type="hidden" value={field.value} />
