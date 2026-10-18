import * as Effect from "effect/Effect"
import * as Cause from "effect/Cause"
import * as Exit from "effect/Exit"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import { flushSync, mount, unmount } from "svelte"
import { afterEach, expect, test, vi } from "vitest"
import Migration from "./Migration.svelte"

const cleanups: Array<() => void> = []
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup() })

const setup = (props: Parameters<typeof Migration>[1] = {}) => {
  const target = document.createElement("div")
  document.body.appendChild(target)
  const app = mount(Migration, { target, props })
  flushSync()
  cleanups.push(() => { unmount(app); target.remove() })
  const input = () => target.querySelector<HTMLInputElement>('[data-testid=age]')!
  const edit = (value: string) => {
    input().value = value
    input().dispatchEvent(new Event("input", { bubbles: true }))
    flushSync()
  }
  const text = (id: string) => target.querySelector(`[data-testid=${id}]`)!.textContent
  return { target, app, input, edit, text }
}

test("Schema v4 codecs decode values and PromiseLike submissions resolve", async () => {
  const spy = vi.fn(async (age: number) => age + 1)
  const { app, target } = setup({ onSubmit: spy })
  expect(target.querySelector<HTMLInputElement>('[data-testid="tags[0].label"]')!.value).toBe("effect")
  const exit = await app.submit()
  expect(Exit.isSuccess(exit)).toBe(true)
  if (Exit.isSuccess(exit)) expect(exit.value).toBe(22)
  expect(spy).toHaveBeenCalledWith(21)
})

test("invalid encoded input produces SchemaError, not a submit call", async () => {
  const spy = vi.fn(async (age: number) => age)
  const { app, edit, text } = setup({ onSubmit: spy })
  edit("bad")
  const exit = await app.submit()
  expect(Exit.isFailure(exit)).toBe(true)
  if (Exit.isFailure(exit)) {
    const error = Cause.findErrorOption(exit.cause)
    expect(Option.isSome(error)).toBe(true)
    if (Option.isSome(error)) expect(Schema.isSchemaError(error.value)).toBe(true)
  }
  expect(spy).not.toHaveBeenCalled()
  await vi.waitFor(() => { flushSync(); expect(text("errors")).not.toBe("") })
})

test("submitErrors maps typed failures to field errors and edits clear them", async () => {
  const { app, edit, text } = setup({ onSubmit: () => Effect.fail("Age rejected") })
  expect(Exit.isFailure(await app.submit())).toBe(true)
  flushSync()
  expect(text("errors")).toBe("Age rejected")
  edit("30")
  expect(text("errors")).toBe("")
})

test("reset and revert preserve encoded values with v4 codecs", async () => {
  const { app, input, edit, text } = setup()
  edit("30")
  expect(text("dirty")).toBe("true")
  await app.submit()
  edit("40")
  app.revert()
  flushSync()
  expect(input().value).toBe("30")
  app.reset()
  flushSync()
  expect(input().value).toBe("21")
  expect(text("dirty")).toBe("false")
  expect(text("count")).toBe("0")
})

test("initialize clears previous submit state when remounted", async () => {
  const { app, target, input, edit, text } = setup()
  edit("30")
  await app.submit()
  const toggle = target.querySelector<HTMLButtonElement>('[data-testid=toggle]')!
  toggle.click(); flushSync()
  toggle.click(); flushSync()
  expect(input().value).toBe("21")
  expect(text("count")).toBe("0")
  expect(text("errors")).toBe("")
})

test("KeepAlive preserves edits across Initialize remounts", () => {
  const { target, input, edit } = setup({ keepAlive: true })
  edit("35")
  const toggle = target.querySelector<HTMLButtonElement>('[data-testid=toggle]')!
  toggle.click(); flushSync()
  toggle.click(); flushSync()
  expect(input().value).toBe("35")
})

test("validateOnInit validates v4 schemas", async () => {
  const { text } = setup({ invalid: true, validateOnInit: true })
  await vi.waitFor(() => { flushSync(); expect(text("errors")).not.toBe("") })
})

test("setValues updates encoded values and nested array components", () => {
  const { app, input, target } = setup()
  app.setValues({ age: "50", tags: [{ label: "v4" }] })
  flushSync()
  expect(input().value).toBe("50")
  expect(target.querySelector<HTMLInputElement>('[data-testid="tags[0].label"]')!.value).toBe("v4")
  const values = app.getValues()
  expect(Option.isSome(values)).toBe(true)
  if (Option.isSome(values)) expect(values.value.age).toBe("50")
})
