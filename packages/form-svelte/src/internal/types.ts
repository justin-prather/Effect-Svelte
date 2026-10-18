import type { FieldState as FieldStateModule, FormAtoms } from "@lucas-barake/effect-form"
import type * as FormBuilder from "@lucas-barake/effect-form/FormBuilder"
import type * as Option from "effect/Option"
import type * as Atom from "effect/reactivity/Atom"
import type * as Schema from "effect/Schema"
import type { Component } from "svelte"

export interface FieldComponentProps<E, P = Record<string, never>> {
  readonly field: FieldStateModule.FieldState<E>
  readonly props: P
}

export type StateAtom = Atom.Writable<
  Option.Option<FormBuilder.FormState<any>>,
  Option.Option<FormBuilder.FormState<any>>
>

export interface FieldRendererConfig<P = Record<string, never>> {
  readonly fieldKey: string
  readonly schema: Schema.Top
  readonly getOrCreateFieldAtoms: (fieldPath: string, schema: Schema.Top) => FormAtoms.FieldAtoms
  readonly component: Component<FieldComponentProps<any, P>>
  readonly onBlurSubmitAtom: Atom.Writable<void, void>
}

export interface ArrayFieldRendererConfig {
  readonly fieldKey: string
  readonly itemSchema: Schema.Top
  readonly stateAtom: StateAtom
  readonly operations: FormAtoms.FormOperations<any>
}

export interface InitializeRendererConfig {
  readonly initializeAtom: Atom.Writable<void, any>
  readonly stateAtom: StateAtom
  readonly validateAtom: Atom.Writable<any, any>
  readonly keepAliveActiveAtom: Atom.Writable<boolean, boolean>
  readonly autoSubmitAtom: Atom.Atom<unknown>
}

export interface KeepAliveRendererConfig {
  readonly keepAliveActiveAtom: Atom.Writable<boolean, boolean>
  readonly mountAtom: Atom.Atom<void>
}
