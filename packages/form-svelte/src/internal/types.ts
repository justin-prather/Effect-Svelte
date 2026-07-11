import type * as Atom from "@effect-atom/atom/Atom"
import type { FieldState as FieldStateModule, FormAtoms } from "@lucas-barake/effect-form"
import type * as FormBuilder from "@lucas-barake/effect-form/FormBuilder"
import type * as Option from "effect/Option"
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

export interface FieldRendererConfig {
  readonly fieldKey: string
  readonly schema: Schema.Schema.Any
  readonly getOrCreateFieldAtoms: (fieldPath: string, schema: Schema.Schema.Any) => FormAtoms.FieldAtoms
  readonly component: Component<FieldComponentProps<any, any>>
  readonly onBlurSubmitAtom: Atom.Writable<void, void>
}

export interface ArrayFieldRendererConfig {
  readonly fieldKey: string
  readonly itemSchema: Schema.Schema.Any
  readonly stateAtom: StateAtom
  readonly operations: FormAtoms.FormOperations<any>
}

export interface InitializeRendererConfig {
  readonly stateAtom: StateAtom
  readonly validateAtom: Atom.Writable<any, any>
  readonly keepAliveActiveAtom: Atom.Writable<boolean, boolean>
  readonly autoSubmitAtom: Atom.Atom<unknown>
  readonly operations: FormAtoms.FormOperations<any>
}

export interface KeepAliveRendererConfig {
  readonly keepAliveActiveAtom: Atom.Writable<boolean, boolean>
  readonly mountAtom: Atom.Atom<void>
}
