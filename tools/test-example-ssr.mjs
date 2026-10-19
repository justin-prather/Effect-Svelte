import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("../", import.meta.url))
const temporary = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), "effect-svelte-ssr-"))

try {
  const cookie = join(temporary, "node_modules/cookie")
  await mkdir(cookie, { recursive: true })
  await writeFile(
    join(cookie, "package.json"),
    JSON.stringify({ name: "cookie", version: "2.0.1", type: "module", exports: "./index.js" })
  )
  await writeFile(
    join(cookie, "index.js"),
    'throw new Error("SSR must not load the parent workspace cookie package");\n' +
      "export const parseCookie = () => ({});\nexport const stringifyCookie = () => '';\n"
  )

  for (const name of ["atom-demo", "form-demo"]) {
    const source = join(root, "examples", name)
    const target = join(temporary, "checkout/examples", name)
    await cp(source, target, {
      recursive: true,
      filter: (path) => !["node_modules", ".svelte-kit", "build"].includes(basename(path))
    })
    await symlink(join(source, "node_modules"), join(target, "node_modules"), "dir")

    const result = spawnSync("bun", ["run", "build"], { cwd: target, stdio: "inherit" })
    assert.ifError(result.error)
    assert.equal(result.status, 0, `${name} must build with an incompatible parent cookie package`)
    const html = await readFile(join(target, "build/index.html"), "utf8")
    assert.ok(html.includes("<body"), `${name} must produce prerendered HTML`)
    // Guard the guard: if a compatible cookie ever becomes resolvable from the example's own
    // node_modules, removing ssr.noExternal would still build, so assert on the bundle itself.
    const server = await readFile(join(target, ".svelte-kit/output/server/index.js"), "utf8")
    assert.ok(
      !/(?:from\s*["']cookie["']|\brequire\s*\(\s*["']cookie["']\s*\))/.test(server),
      `${name} must inline SvelteKit's cookie dependency in the server bundle`
    )
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
