import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [sveltekit()],
  ssr: {
    // Bundle Kit's cookie dependency instead of resolving it from a parent workspace at runtime.
    noExternal: ["cookie"]
  }
})
