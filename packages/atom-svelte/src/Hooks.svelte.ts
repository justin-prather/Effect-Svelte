/**
 * Svelte 5 ports of the `@effect/atom-react` hooks.
 *
 * All functions must be called during component initialization (they rely on
 * `$effect` and Svelte's context API), mirroring the constraints of the
 * React/Vue/Solid bindings. Reactive values are returned as objects with a
 * reactive `current` property, following the `svelte/reactivity` convention.
 *
 * Every function also accepts a thunk (`() => atom`) so the target atom can
 * itself be derived from reactive state.
 *
 * @since 1.0.0
 */
import * as Atom from "effect/reactivity/Atom"
import type * as AtomRef from "effect/reactivity/AtomRef"
import * as Registry from "effect/reactivity/AtomRegistry"
import * as Result from "effect/reactivity/AsyncResult"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import { useRegistry } from "./RegistryContext.js"

/**
 * A read-only reactive view of an atom's value.
 *
 * @since 1.0.0
 * @category models
 */
export interface ReadonlyAtomState<A> {
  readonly current: A
}

/**
 * A read-write reactive view of a writable atom.
 *
 * Assigning to `current` writes the value directly to the registry, which
 * makes `bind:` usable for simple state atoms (where the read and write types
 * coincide). The `set` function supports updater functions and the
 * promise-based modes.
 *
 * @since 1.0.0
 * @category models
 */
export interface AtomState<R, W, Set> {
  current: R
  readonly set: Set
}

/**
 * @since 1.0.0
 * @category models
 */
export type AtomSetter<R, W, Mode extends "value" | "promise" | "promiseExit" = never> = "promise" extends Mode ? (
    (value: W) => Promise<Result.AsyncResult.Success<R>>
  ) :
  "promiseExit" extends Mode ? (
      (value: W) => Promise<Exit.Exit<Result.AsyncResult.Success<R>, Result.AsyncResult.Failure<R>>>
    ) :
  ((value: W | ((value: R) => W)) => void)

type AtomOrGetter<A extends Atom.Atom<any>> = A | (() => A)

const toGetter = <A extends Atom.Atom<any>>(atom: AtomOrGetter<A>): () => A =>
  Atom.isAtom(atom) ? () => atom : atom as () => A

const makeAtomState = <A>(registry: Registry.AtomRegistry, atom: () => Atom.Atom<A>): ReadonlyAtomState<A> => {
  let version = $state(0)
  $effect(() => {
    return registry.subscribe(atom(), () => {
      version += 1
    })
  })
  return {
    get current() {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      version
      return registry.get(atom())
    }
  }
}

const initialValuesSet = new WeakMap<Registry.AtomRegistry, WeakSet<Atom.Atom<any>>>()

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomInitialValues = (initialValues: Iterable<readonly [Atom.Atom<any>, any]>): void => {
  const registry = useRegistry()
  let set = initialValuesSet.get(registry)
  if (set === undefined) {
    set = new WeakSet()
    initialValuesSet.set(registry, set)
  }
  for (const [atom, value] of initialValues) {
    if (!set.has(atom)) {
      set.add(atom)
      ;(registry as any).ensureNode(atom).setValue(value)
    }
  }
}

/**
 * Read an atom's value reactively, optionally through a mapping function.
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomValue: {
  <A>(atom: AtomOrGetter<Atom.Atom<A>>): ReadonlyAtomState<A>
  <A, B>(atom: AtomOrGetter<Atom.Atom<A>>, f: (_: A) => B): ReadonlyAtomState<B>
} = (<A>(atom: AtomOrGetter<Atom.Atom<A>>, f?: (_: A) => A): ReadonlyAtomState<A> => {
  const registry = useRegistry()
  const getAtom = toGetter(atom)
  if (f) {
    // memoize Atom.map per source atom, so a stable atom yields a stable
    // mapped atom across reads
    let source: Atom.Atom<A> | undefined
    let mapped: Atom.Atom<A> | undefined
    return makeAtomState(registry, () => {
      const s = getAtom()
      if (s !== source) {
        source = s
        mapped = Atom.map(s, f)
      }
      return mapped!
    })
  }
  return makeAtomState(registry, getAtom)
}) as any

function mountAtom<A>(registry: Registry.AtomRegistry, atom: () => Atom.Atom<A>): void {
  $effect(() => registry.mount(atom()))
}

function setAtom<R, W, Mode extends "value" | "promise" | "promiseExit" = never>(
  registry: Registry.AtomRegistry,
  atom: () => Atom.Writable<R, W>,
  options?: {
    readonly mode?: ([R] extends [Result.AsyncResult<any, any>] ? Mode : "value") | undefined
  }
): AtomSetter<R, W, Mode> {
  if (options?.mode === "promise" || options?.mode === "promiseExit") {
    return ((value: W) => {
      const current = atom()
      registry.set(current, value)
      const promise = Effect.runPromiseExit(
        Registry.getResult(registry, current as Atom.Atom<Result.AsyncResult<any, any>>, { suspendOnWaiting: true })
      )
      return options!.mode === "promise" ? promise.then(flattenExit) : promise
    }) as any
  }
  return ((value: W | ((value: R) => W)) => {
    const current = atom()
    registry.set(current, typeof value === "function" ? (value as any)(registry.get(current)) : value)
  }) as any
}

const flattenExit = <A, E>(exit: Exit.Exit<A, E>): A => {
  if (Exit.isSuccess(exit)) return exit.value
  throw Cause.squash(exit.cause)
}

/**
 * Keep an atom mounted for the lifetime of the component.
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomMount = <A>(atom: AtomOrGetter<Atom.Atom<A>>): void => {
  const registry = useRegistry()
  mountAtom(registry, toGetter(atom))
}

/**
 * Get a setter function for a writable atom, keeping it mounted for the
 * lifetime of the component.
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomSet = <R, W, const Mode extends "value" | "promise" | "promiseExit" = never>(
  atom: AtomOrGetter<Atom.Writable<R, W>>,
  options?: {
    readonly mode?: ([R] extends [Result.AsyncResult<any, any>] ? Mode : "value") | undefined
  }
): AtomSetter<R, W, Mode> => {
  const registry = useRegistry()
  const getAtom = toGetter(atom)
  mountAtom(registry, getAtom)
  return setAtom(registry, getAtom, options)
}

/**
 * Get a function that refreshes an atom, keeping it mounted for the lifetime
 * of the component.
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRefresh = <A>(atom: AtomOrGetter<Atom.Atom<A>>): () => void => {
  const registry = useRegistry()
  const getAtom = toGetter(atom)
  mountAtom(registry, getAtom)
  return () => registry.refresh(getAtom())
}

/**
 * Read and write a writable atom reactively.
 *
 * ```svelte
 * <script>
 *   const count = useAtom(countAtom)
 * </script>
 *
 * <input type="number" bind:value={count.current} />
 * <button onclick={() => count.set((n) => n + 1)}>+1</button>
 * ```
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtom = <R, W, const Mode extends "value" | "promise" | "promiseExit" = never>(
  atom: AtomOrGetter<Atom.Writable<R, W>>,
  options?: {
    readonly mode?: ([R] extends [Result.AsyncResult<any, any>] ? Mode : "value") | undefined
  }
): AtomState<R, W, AtomSetter<R, W, Mode>> => {
  const registry = useRegistry()
  const getAtom = toGetter(atom)
  const state = makeAtomState(registry, getAtom)
  const set = setAtom(registry, getAtom, options)
  return {
    get current() {
      return state.current
    },
    set current(value: R) {
      registry.set(getAtom(), value as unknown as W)
    },
    set
  }
}

/**
 * Subscribe to an atom's changes for the lifetime of the component.
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomSubscribe = <A>(
  atom: AtomOrGetter<Atom.Atom<A>>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
): void => {
  const registry = useRegistry()
  const getAtom = toGetter(atom)
  $effect(() => registry.subscribe(getAtom(), f, options))
}

/**
 * A port of `useAtomSuspense`, adapted for Svelte's `{#await}` blocks: the
 * returned `current` is a stable promise that resolves once the atom's
 * `Result` is no longer `Initial` (or waiting, with `suspendOnWaiting`).
 *
 * ```svelte
 * {#await users.current}
 *   <Spinner />
 * {:then result}
 *   <List items={result.value} />
 * {/await}
 * ```
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomSuspense = <A, E, const IncludeFailure extends boolean = false>(
  atom: AtomOrGetter<Atom.Atom<Result.AsyncResult<A, E>>>,
  options?: {
    readonly suspendOnWaiting?: boolean | undefined
    readonly includeFailure?: IncludeFailure | undefined
  }
): ReadonlyAtomState<
  Promise<Result.Success<A, E> | (IncludeFailure extends true ? Result.Failure<A, E> : never)>
> => {
  const registry = useRegistry()
  const getAtom = toGetter(atom)
  const state = makeAtomState(registry, getAtom)
  const suspendOnWaiting = options?.suspendOnWaiting ?? false

  let pending:
    | {
      readonly promise: Promise<any>
      readonly resolve: (value: any) => void
      readonly reject: (error: unknown) => void
    }
    | undefined
  let settled: { readonly result: Result.AsyncResult<A, E>; readonly promise: Promise<any> } | undefined

  const settle = (result: Result.AsyncResult<A, E>): Promise<any> => {
    let promise: Promise<any>
    if (result._tag === "Failure" && !options?.includeFailure) {
      const error = Cause.squash(result.cause)
      if (pending !== undefined) {
        promise = pending.promise
        pending.reject(error)
        pending = undefined
      } else {
        promise = Promise.reject(error)
        // avoid unhandled rejection warnings when nobody awaits the cached
        // promise before it is replaced
        promise.catch(() => {})
      }
    } else if (pending !== undefined) {
      promise = pending.promise
      pending.resolve(result)
      pending = undefined
    } else {
      promise = Promise.resolve(result)
    }
    settled = { result, promise }
    return promise
  }

  return {
    get current() {
      const result = state.current
      if (result._tag === "Initial" || (suspendOnWaiting && result.waiting)) {
        settled = undefined
        if (pending === undefined) {
          let resolve!: (value: any) => void
          let reject!: (error: unknown) => void
          const promise = new Promise<any>((res, rej) => {
            resolve = res
            reject = rej
          })
          pending = { promise, resolve, reject }
        }
        return pending.promise
      }
      if (settled !== undefined && settled.result === result) {
        return settled.promise
      }
      return settle(result)
    }
  }
}

/**
 * Read an `AtomRef`'s value reactively.
 *
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRef = <A>(ref: AtomRef.ReadonlyRef<A> | (() => AtomRef.ReadonlyRef<A>)): ReadonlyAtomState<A> => {
  const getRef = typeof ref === "function" ? ref : () => ref
  let version = $state(0)
  $effect(() =>
    getRef().subscribe(() => {
      version += 1
    })
  )
  return {
    get current() {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      version
      return getRef().value
    }
  }
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRefProp = <A, K extends keyof A>(ref: AtomRef.AtomRef<A>, prop: K): AtomRef.AtomRef<A[K]> =>
  ref.prop(prop)

/**
 * @since 1.0.0
 * @category hooks
 */
export const useAtomRefPropValue = <A, K extends keyof A>(
  ref: AtomRef.AtomRef<A>,
  prop: K
): ReadonlyAtomState<A[K]> => useAtomRef(useAtomRefProp(ref, prop))
