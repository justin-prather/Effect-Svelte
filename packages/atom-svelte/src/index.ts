/**
 * Svelte 5 bindings for `effect/reactivity`, mirroring the API of
 * `@effect/atom-react`.
 *
 * @since 1.0.0
 */

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as Atom from "effect/reactivity/Atom"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as AtomRegistry from "effect/reactivity/AtomRegistry"

export * as Registry from "effect/reactivity/AtomRegistry"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as AsyncResult from "effect/reactivity/AsyncResult"

export * as Result from "effect/reactivity/AsyncResult"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as AtomRef from "effect/reactivity/AtomRef"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as AtomHttpApi from "effect/reactivity/AtomHttpApi"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as AtomRpc from "effect/reactivity/AtomRpc"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as Hydration from "effect/reactivity/Hydration"

/**
 * @since 1.0.0
 * @category re-exports
 */
export * as ScopedAtom from "./ScopedAtom.js"

/**
 * @since 1.0.0
 * @category hooks
 */
export * from "./Hooks.svelte.js"

/**
 * @since 1.0.0
 * @category context
 */
export * from "./RegistryContext.js"

/**
 * @since 1.0.0
 * @category components
 */
export { default as RegistryProvider } from "./RegistryProvider.svelte"

/**
 * @since 1.0.0
 * @category components
 */
export { default as HydrationBoundary } from "./HydrationBoundary.svelte"
