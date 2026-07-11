/**
 * A port of `@effect-atom/atom-react`'s `ScopedAtom`, using Svelte's context
 * API. Instead of a `Provider` component, call `provide()` during the
 * initialization of the component that should own the atom; descendants can
 * then access it with `use()`.
 *
 * @since 1.0.0
 */
import type * as Atom from "@effect-atom/atom/Atom"
import { getContext, setContext } from "svelte"

/**
 * @since 1.0.0
 * @category Type IDs
 */
export type TypeId = "~atom-svelte/ScopedAtom"

/**
 * @since 1.0.0
 * @category Type IDs
 */
export const TypeId: TypeId = "~atom-svelte/ScopedAtom"

/**
 * @since 1.0.0
 * @category models
 */
export interface ScopedAtom<A extends Atom.Atom<any>, Input = never> {
  readonly [TypeId]: TypeId
  /**
   * Retrieve the scoped atom from the Svelte context. Must be called during
   * component initialization, below a component that called `provide`.
   */
  use(): A
  /**
   * Create the atom and provide it to child components via the Svelte
   * context. Must be called during component initialization.
   */
  provide(...args: [Input] extends [never] ? [] : [input: Input]): A
}

/**
 * @since 1.0.0
 * @category constructors
 */
export const make = <A extends Atom.Atom<any>, Input = never>(
  f: (() => A) | ((input: Input) => A)
): ScopedAtom<A, Input> => {
  const key = Symbol("atom-svelte/ScopedAtom")
  return {
    [TypeId]: TypeId,
    use: () => {
      const atom = getContext<A | undefined>(key)
      if (atom === undefined) {
        throw new Error("ScopedAtom used outside of a component that provides it")
      }
      return atom
    },
    provide: (...args) => setContext(key, f(args[0] as Input))
  }
}
