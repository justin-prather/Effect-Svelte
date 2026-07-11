import { flushSync, mount, unmount } from "svelte"
import { expect, test, vi } from "vitest"

import App from "./App.svelte"

const type = (input: HTMLInputElement, value: string) => {
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
  flushSync()
}

test("form flow: initialize, submit, array items, validation", async () => {
  const spy = vi.fn()
  const target = document.createElement("div")
  document.body.appendChild(target)
  const app = mount(App, { target, props: { onSubmitSpy: spy } })
  flushSync()

  // initialized with default values
  const name = target.querySelector<HTMLInputElement>("[data-testid=name]")!
  expect(name).toBeTruthy()
  expect(name.value).toBe("Ada")
  expect(name.placeholder).toBe("Your name")

  // submit with valid values decodes through the schema
  target.querySelector<HTMLElement>("[data-testid=submit]")!.click()
  flushSync()
  await vi.waitFor(() => expect(spy).toHaveBeenCalledWith({ name: "Ada", tags: [] }))

  // append an array item and edit its nested field
  target.querySelector<HTMLElement>("[data-testid=append]")!.click()
  flushSync()
  const tag = target.querySelector<HTMLInputElement>("[data-testid='tags[0].label']")!
  expect(tag).toBeTruthy()
  type(tag, "effect")

  target.querySelector<HTMLElement>("[data-testid=submit]")!.click()
  flushSync()
  await vi.waitFor(() =>
    expect(spy).toHaveBeenLastCalledWith({ name: "Ada", tags: [{ label: "effect" }] })
  )

  // a second appended item gets its own path
  target.querySelector<HTMLElement>("[data-testid=append]")!.click()
  flushSync()
  expect(target.querySelector("[data-testid='tags[1].label']")).toBeTruthy()

  // removing the first item shifts values down
  target.querySelector<HTMLElement>("[data-testid='remove-0']")!.click()
  flushSync()
  expect(target.querySelector<HTMLInputElement>("[data-testid='tags[0].label']")!.value).toBe("")
  expect(target.querySelector("[data-testid='tags[1].label']")).toBeNull()

  // invalid value: submit is rejected and the field error is displayed
  type(name, "")
  name.dispatchEvent(new Event("blur"))
  flushSync()
  const calls = spy.mock.calls.length
  target.querySelector<HTMLElement>("[data-testid=submit]")!.click()
  flushSync()
  await vi.waitFor(() => {
    flushSync()
    expect(target.querySelector("[data-testid='name-error']")).toBeTruthy()
  })
  expect(spy.mock.calls.length).toBe(calls)

  unmount(app)
  target.remove()
})
