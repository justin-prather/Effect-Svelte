/**
 * @since 1.0.0
 */
import type * as Atom from "@effect-atom/atom/Atom"
import * as Registry from "@effect-atom/atom/Registry"
import { globalValue } from "effect/GlobalValue"
import { getContext, setContext } from "svelte"

/**
 * The context key under which the `Registry` is provided to the component
 * tree.
 *
 * @since 1.0.0
 * @category context
 */
export const registryKey: unique symbol = Symbol.for("atom-svelte/registryKey")

/**
 * The registry used when no `RegistryProvider` (or `provideRegistry`) is
 * present in the component tree.
 *
 * @since 1.0.0
 * @category context
 */
export const defaultRegistry: Registry.Registry = globalValue(
  "atom-svelte/defaultRegistry",
  () => Registry.make({ defaultIdleTTL: 400 })
)

/**
 * Retrieve the `Registry` from the Svelte context, falling back to the
 * global `defaultRegistry`. Must be called during component initialization.
 *
 * @since 1.0.0
 * @category context
 */
export const useRegistry = (): Registry.Registry => getContext<Registry.Registry>(registryKey) ?? defaultRegistry

/**
 * Provide a `Registry` to all child components via the Svelte context. Must
 * be called during component initialization.
 *
 * Prefer the `RegistryProvider` component unless you need to create the
 * registry yourself.
 *
 * @since 1.0.0
 * @category context
 */
export const provideRegistry = (registry: Registry.Registry): Registry.Registry => setContext(registryKey, registry)

/**
 * Options for creating a `Registry`, mirroring `Registry.make`.
 *
 * @since 1.0.0
 * @category context
 */
export interface RegistryOptions {
  readonly initialValues?: Iterable<readonly [Atom.Atom<any>, any]> | undefined
  readonly scheduleTask?: ((f: () => void) => void) | undefined
  readonly timeoutResolution?: number | undefined
  readonly defaultIdleTTL?: number | undefined
}
