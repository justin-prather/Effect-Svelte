import { Atom, defaultRegistry, Registry } from "atom-svelte"
import * as Effect from "effect/Effect"
import { flushSync, mount, unmount } from "svelte"
import { afterEach, expect, test, vi } from "vitest"

import AsyncResult from "./AsyncResult.svelte"
import Counter from "./Counter.svelte"
import Provided from "./Provided.svelte"

let cleanup: Array<() => void> = []

const setup = <Props extends Record<string, any>>(component: any, props: Props) => {
  const target = document.createElement("div")
  document.body.appendChild(target)
  const instance = mount(component, { target, props })
  flushSync()
  cleanup.push(() => {
    unmount(instance)
    target.remove()
  })
  return { target, instance }
}

afterEach(() => {
  for (const f of cleanup) f()
  cleanup = []
})

test("useAtom reads and writes, useAtomValue maps", () => {
  const atom = Atom.make(0)
  const app = setup(Counter, { atom })

  const button = app.target.querySelector("button")!
  const doubled = app.target.querySelector("[data-testid=doubled]")!
  expect(button.textContent).toBe("0")
  expect(doubled.textContent).toBe("0")

  button.click()
  flushSync()
  expect(button.textContent).toBe("1")
  expect(doubled.textContent).toBe("2")
  expect(defaultRegistry.get(atom)).toBe(1)
})

test("bind:current writes back to the atom", () => {
  const atom = Atom.make(5)
  const app = setup(Counter, { atom })

  const input = app.target.querySelector<HTMLInputElement>("[data-testid=bound]")!
  expect(input.value).toBe("5")

  input.value = "42"
  input.dispatchEvent(new Event("input", { bubbles: true }))
  flushSync()
  expect(defaultRegistry.get(atom)).toBe(42)

  const button = app.target.querySelector("button")!
  expect(button.textContent).toBe("42")
})

test("RegistryProvider isolates state from the default registry", () => {
  const atom = Atom.make(0)
  const registry = Registry.make()
  const app = setup(Provided, { atom, registry })

  const button = app.target.querySelector("button")!
  button.click()
  flushSync()

  expect(registry.get(atom)).toBe(1)
  expect(defaultRegistry.get(atom)).toBe(0)
})

test("useAtomSet promise mode resolves with the success value", async () => {
  const fnAtom = Atom.fn((n: number) => Effect.succeed(n * 10).pipe(Effect.delay("10 millis")))
  const app = setup(AsyncResult, { fnAtom })

  const span = app.target.querySelector("[data-testid=result]")!
  expect(span.textContent?.trim()).toBe("Initial")

  const promise = (app.instance as any).run(3)
  await expect(promise).resolves.toBe(30)

  await vi.waitFor(() => {
    flushSync()
    expect(span.textContent?.trim()).toBe("30")
  })
})
