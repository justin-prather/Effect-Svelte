export interface ArrayItemContext {
  readonly index: number
  readonly parentPath: string
}

export const arrayItemContextKey: unique symbol = Symbol.for("form-svelte/ArrayItemContext")
