import {
  Atom,
  AtomRef,
  AsyncResult as AR,
  AtomRegistry,
  Hydration,
  Result,
  defaultRegistry,
  Registry
} from "atom-svelte"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import { flushSync, mount, unmount, type Component } from "svelte"
import { afterEach, expect, test, vi } from "vitest"

import Advanced from "./Advanced.svelte"
import AsyncResult from "./AsyncResult.svelte"
import Counter from "./Counter.svelte"
import DeferredOtherHooks from "./DeferredOtherHooks.svelte"
import DeferredRead from "./DeferredRead.svelte"
import Lifecycle from "./Lifecycle.svelte"
import Provided from "./Provided.svelte"

let cleanup: Array<() => Promise<void>> = []

const setup = <Props extends Record<string, any>, Exports extends Record<string, any>>(
  component: Component<Props, Exports>,
  props: Props
) => {
  const target = document.createElement("div")
  document.body.appendChild(target)
  const instance = mount(component, { target, props })
  flushSync()
  let mounted = true

  const destroy = async () => {
    if (!mounted) return
    mounted = false
    await unmount(instance)
    target.remove()
  }

  cleanup.push(destroy)

  return { target, instance, destroy }
}

afterEach(async () => {
  for (const f of cleanup) await f()
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

test.each([false, true])("a deferred derived read is safe (mapped=%s)", async (mapped) => {
  const atom = Atom.make(42)
  const registry = Registry.make()
  const app = setup(DeferredRead, { atom, registry, mapped })

  try {
    expect(app.instance.read()).toBe(mapped ? 84 : 42)
    app.instance.show()
    flushSync()
    registry.set(atom, 43)
    flushSync()
    expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe(mapped ? "86" : "43")
  } finally {
    await app.destroy()
    registry.dispose()
  }
})

test("deferred reads switch to cold atoms and stop observing the previous atom", async () => {
  const first = Atom.make(1)
  const second = Atom.make(2)
  const registry = Registry.make()
  const app = setup(DeferredRead, { atom: first, registry })

  try {
    expect(app.instance.read()).toBe(1)
    app.instance.select(second)
    flushSync()
    expect(app.instance.read()).toBe(2)
    app.instance.show()
    flushSync()
    registry.set(second, 12)
    registry.set(first, 99)
    flushSync()
    expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("12")
  } finally {
    await app.destroy()
    registry.dispose()
  }
})

test("deferred async atoms deliver their result after the first read", async () => {
  const result = Atom.make(Effect.succeed(42).pipe(Effect.delay("10 millis")))
  const atom = Atom.map(result, (value) => (AR.isSuccess(value) ? value.value : -1))
  const registry = Registry.make()
  const app = setup(DeferredRead, { atom, registry })

  try {
    expect(app.instance.read()).toBe(-1)
    app.instance.show()
    flushSync()
    await vi.waitFor(() => {
      flushSync()
      expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("42")
    })
  } finally {
    await app.destroy()
    registry.dispose()
  }
})

test.each(["writable", "suspense"] as const)(
  "deferred %s hooks use the safe read bridge",
  async (hook) => {
    const registry = Registry.make()

    const app = setup(DeferredOtherHooks, {
      registry,
      count: Atom.make(42),
      result: Atom.make(AR.success(42))
    })

    try {
      if (hook === "writable") {
        expect(app.instance.readWritable()).toBe(42)
      } else {
        const result = await app.instance.readSuspense()
        expect(AR.isSuccess(result)).toBe(true)

        if (AR.isSuccess(result)) expect(result.value).toBe(42)
      }
    } finally {
      await app.destroy()
      registry.dispose()
    }
  }
)

test("shared atom readers clean up independently and can remount", async () => {
  const atom = Atom.make(1)
  const registry = Registry.make()
  const subscribe = registry.subscribe.bind(registry)
  let subscriptions = 0
  vi.spyOn(registry, "subscribe").mockImplementation((atom, listener, options) => {
    const stop = subscribe(atom, listener, options)
    subscriptions++

    return () => {
      subscriptions--
      stop()
    }
  })
  const first = setup(DeferredRead, { atom, registry })
  const second = setup(DeferredRead, { atom, registry })

  try {
    first.instance.show()
    second.instance.show()
    flushSync()
    expect(subscriptions).toBe(2)
    await first.destroy()
    await vi.waitFor(() => expect(subscriptions).toBe(1))
    registry.set(atom, 2)
    flushSync()
    expect(second.target.querySelector("[data-testid=value]")!.textContent).toBe("2")
    second.instance.hide()
    flushSync()
    await vi.waitFor(() => expect(subscriptions).toBe(0))
    second.instance.show()
    flushSync()
    expect(subscriptions).toBe(1)
    expect(second.target.querySelector("[data-testid=value]")!.textContent).toBe("2")
    await second.destroy()
    await vi.waitFor(() => expect(subscriptions).toBe(0))
    registry.set(atom, 3)
    const remounted = setup(DeferredRead, { atom, registry })
    remounted.instance.show()
    flushSync()
    expect(remounted.target.querySelector("[data-testid=value]")!.textContent).toBe("3")
    await remounted.destroy()
    await vi.waitFor(() => expect(subscriptions).toBe(0))
  } finally {
    await first.destroy()
    await second.destroy()
    registry.dispose()
  }
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

  const promise = app.instance.run(3)
  await expect(promise).resolves.toBe(30)

  await vi.waitFor(() => {
    flushSync()
    expect(span.textContent?.trim()).toBe("30")
  })
})

test("v4 exports refer to the core modules, including compatibility aliases", () => {
  expect(Registry).toBe(AtomRegistry)
  expect(Result).toBe(AR)
})

const advanced = (effect: (n: number) => Effect.Effect<number, string> = Effect.succeed) => {
  const atom = Atom.make(0)
  const result = Atom.fn(effect)
  const ref = AtomRef.make(1)
  const onChange = vi.fn()
  const app = setup(Advanced, { atom, result, ref, onChange })

  return { ...app, atom, result, ref, onChange }
}

test("initial values seed once and AtomRef updates remain reactive", () => {
  const app = advanced()
  expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("7")
  defaultRegistry.set(app.atom, 9)
  app.ref.set(2)
  flushSync()
  expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("9")
  expect(app.target.querySelector("[data-testid=ref]")!.textContent).toBe("2")
  expect(app.onChange).toHaveBeenLastCalledWith(9)
  setup(Advanced, { atom: app.atom, result: app.result, ref: app.ref, initial: 100 })
  expect(defaultRegistry.get(app.atom)).toBe(9)
})

test("thunk atoms switch subscriptions when the component prop changes", async () => {
  const first = Atom.make(1)
  const second = Atom.make(2)
  // Mount through a reactive parent so prop replacement uses Svelte's public API.
  const { default: Switching } = await import("./Switching.svelte")
  const app = setup(Switching, { first, second })
  app.target.querySelector("button")!.click()
  flushSync()
  defaultRegistry.set(second, 12)
  flushSync()
  expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("12")
  defaultRegistry.set(first, 99)
  flushSync()
  expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("12")
})

test("promise mode rejects typed failures and promiseExit preserves the Cause", async () => {
  const app = advanced(() => Effect.fail("nope"))
  await expect(app.instance.run(1)).rejects.toBe("nope")
  const exit = await app.instance.runExit(2)
  expect(Exit.isFailure(exit)).toBe(true)
  expect(AR.isFailure(defaultRegistry.get(app.result))).toBe(true)
})

test("promiseExit returns successful v4 Exits", async () => {
  const app = advanced((n) => Effect.succeed(n * 2))
  const exit = await app.instance.runExit(4)
  expect(Exit.isSuccess(exit)).toBe(true)

  if (Exit.isSuccess(exit)) expect(exit.value).toBe(8)
})

test("current uses the atom's write type when its read type differs", async () => {
  const app = advanced((n) => Effect.succeed(n * 3))
  app.instance.writeCurrent(4)

  await vi.waitFor(() => {
    flushSync()
    const result = app.instance.readCurrent()
    expect(AR.isSuccess(result)).toBe(true)

    if (AR.isSuccess(result)) expect(result.value).toBe(12)
  })
})

test("suspense caches pending promises and resolves with AsyncResult.Success", async () => {
  const app = advanced((n) => Effect.succeed(n).pipe(Effect.delay("10 millis")))
  const pending = app.instance.pending()
  expect(app.instance.pending()).toBe(pending)
  await app.instance.run(42)
  const settled = app.instance.pending()
  expect(settled).toBe(pending)
  const result = await settled
  expect(AR.isSuccess(result)).toBe(true)

  if (AR.isSuccess(result)) expect(result.value).toBe(42)
  expect(app.instance.pending()).toBe(settled)
})

test("suspense rejects failures unless includeFailure is enabled", async () => {
  const app = advanced(() => Effect.fail("failure"))
  await app.instance.runExit(0)
  await expect(app.instance.pending()).rejects.toBe("failure")
  const result = await app.instance.withFailure()
  expect(AR.isFailure(result)).toBe(true)
})

test("HydrationBoundary restores serialized v4 atom values before children render", () => {
  const atom = Atom.make(0).pipe(
    Atom.serializable({ key: "migration-count", schema: Schema.Number })
  )

  const source = Registry.make()
  source.set(atom, 42)
  const state = Hydration.dehydrate(source)
  expect(state).toHaveLength(1)
  const app = setup(Lifecycle, { atom, state, onRegistry: () => {} })
  expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("42")
  source.dispose()
})

test("RegistryProvider disposes registries it creates on unmount", async () => {
  let registry!: AtomRegistry.AtomRegistry

  const app = setup(Lifecycle, {
    atom: Atom.make(1),
    onRegistry: (value: AtomRegistry.AtomRegistry) => {
      registry = value
    }
  })

  const dispose = vi.spyOn(registry, "dispose")
  await app.destroy()
  expect(dispose).toHaveBeenCalledOnce()
})

test("RegistryProvider leaves externally owned registries alive", async () => {
  const registry = Registry.make()
  const dispose = vi.spyOn(registry, "dispose")
  const atom = Atom.make(1)
  const app = setup(Lifecycle, { atom, registry, onRegistry: () => {} })
  await app.destroy()
  expect(dispose).not.toHaveBeenCalled()
  registry.set(atom, 2)
  expect(registry.get(atom)).toBe(2)
  registry.dispose()
})

test("RegistryProvider accepts the v4 cancellable scheduler contract", () => {
  const scheduleTask = vi.fn((f: () => void) => {
    const id = setTimeout(f, 0)

    return () => clearTimeout(id)
  })

  const app = setup(Lifecycle, { atom: Atom.make(3), scheduleTask, onRegistry: () => {} })
  expect(app.target.querySelector("[data-testid=value]")!.textContent).toBe("3")
  expect(scheduleTask).toHaveBeenCalled()
})

test("v4 atom runtimes provide Context.Service dependencies", async () => {
  class Multiplier extends Context.Service<Multiplier, { readonly factor: number }>()(
    "Multiplier"
  ) {}

  const runtime = Atom.runtime(Layer.succeed(Multiplier, { factor: 3 }))

  const fnAtom = runtime.fn((n: number) =>
    Effect.gen(function* () {
      const { factor } = yield* Multiplier

      return n * factor
    })
  )

  const app = setup(AsyncResult, { fnAtom })
  await expect(app.instance.run(5)).resolves.toBe(15)
})

test("promise mode rejects defects from the flattened v4 Cause", async () => {
  const defect = new Error("broken")
  const app = advanced(() => Effect.die(defect))
  await expect(app.instance.run(0)).rejects.toBe(defect)
})
