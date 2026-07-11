/**
 * Svelte 5 bindings for `@lucas-barake/effect-form`, mirroring the API of
 * `@lucas-barake/effect-form-react`.
 *
 * `make` returns the same atoms as the React bindings, plus Svelte components
 * for each field:
 *
 * ```svelte
 * <script lang="ts">
 *   const login = FormSvelte.make(builder, {
 *     fields: { email: TextInput, password: TextInput },
 *     onSubmit: ({ decoded }) => ...
 *   })
 * </script>
 *
 * <login.Initialize defaultValues={{ email: "", password: "" }}>
 *   <login.email placeholder="you@example.com" />
 *   <login.password />
 * </login.Initialize>
 * ```
 *
 * @since 1.0.0
 */
import * as Atom from "@effect-atom/atom/Atom"
import type * as Registry from "@effect-atom/atom/Registry"
import { Field, FormAtoms } from "@lucas-barake/effect-form"
import type { FieldState as FieldStateModule, Mode } from "@lucas-barake/effect-form"
import type * as FormBuilder from "@lucas-barake/effect-form/FormBuilder"
import type * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type * as Option from "effect/Option"
import type * as ParseResult from "effect/ParseResult"
import type * as Schema from "effect/Schema"
import type { Component, Snippet } from "svelte"
import ArrayFieldRenderer from "./internal/ArrayFieldRenderer.svelte"
import ArrayItemRenderer from "./internal/ArrayItemRenderer.svelte"
import FieldRenderer from "./internal/FieldRenderer.svelte"
import InitializeRenderer from "./internal/InitializeRenderer.svelte"
import KeepAliveRenderer from "./internal/KeepAliveRenderer.svelte"
import type { ArrayFieldRendererConfig, FieldComponentProps } from "./internal/types.js"

export type FieldValue<T> = FieldStateModule.FieldValue<T>

export type FieldState<E> = FieldStateModule.FieldState<E>

export type ArrayFieldOperations<TItem> = FieldStateModule.ArrayFieldOperations<TItem>

export type { FieldComponentProps }

/**
 * The shape of a user-provided field component: it receives the reactive
 * `field` state and any extra `props` passed to the generated component.
 */
export type FieldComponent<T, P = Record<string, never>> = Component<FieldComponentProps<FieldValue<T>, P>>

export type ExtractExtraProps<C> = C extends Component<FieldComponentProps<any, infer P>> ? P
  : Record<string, never>

type StructFieldsFromSchema<S> = S extends Schema.Struct<infer Fields> ? Fields
  : S extends { readonly from: infer From } ? StructFieldsFromSchema<From>
  : never

export type ArrayItemComponentMap<S extends Schema.Schema.Any> = StructFieldsFromSchema<S> extends
  Schema.Struct.Fields ? {
    readonly [K in keyof StructFieldsFromSchema<S>]: StructFieldsFromSchema<S>[K] extends Schema.Schema.Any
      ? Component<FieldComponentProps<Schema.Schema.Encoded<StructFieldsFromSchema<S>[K]>, any>>
      : never
  }
  : Component<FieldComponentProps<Schema.Schema.Encoded<S>, any>>

export type FieldComponentMap<TFields extends Field.FieldsRecord> = {
  readonly [K in keyof TFields]: TFields[K] extends Field.FieldDef<any, infer S>
    ? Component<FieldComponentProps<Schema.Schema.Encoded<S>, any>>
    : TFields[K] extends Field.ArrayFieldDef<any, infer S> ? ArrayItemComponentMap<S>
    : never
}

export type FieldRefs<TFields extends Field.FieldsRecord> = FormAtoms.FieldRefs<TFields>

export type BuiltForm<
  TFields extends Field.FieldsRecord,
  R,
  A = void,
  E = never,
  SubmitArgs = void,
  CM extends FieldComponentMap<TFields> = FieldComponentMap<TFields>
> =
  & {
    readonly values: Atom.Atom<Option.Option<Field.EncodedFromFields<TFields>>>
    readonly isDirty: Atom.Atom<boolean>
    readonly hasChangedSinceSubmit: Atom.Atom<boolean>
    readonly lastSubmittedValues: Atom.Atom<Option.Option<FormBuilder.SubmittedValues<TFields>>>
    readonly submitCount: Atom.Atom<number>
    readonly validationCount: Atom.Atom<number>
    readonly rootError: Atom.Atom<Option.Option<string>>

    readonly schema: Schema.Schema<Field.DecodedFromFields<TFields>, Field.EncodedFromFields<TFields>, R>
    readonly fields: FieldRefs<TFields>

    readonly Initialize: Component<{
      readonly defaultValues: Field.EncodedFromFields<TFields>
      readonly validateOnInit?: boolean
      readonly children?: Snippet
    }>

    readonly submit: Atom.AtomResultFn<SubmitArgs, A, E | ParseResult.ParseError>
    readonly validate: Atom.AtomResultFn<void, void, never>
    readonly reset: Atom.Writable<void, void>
    readonly revertToLastSubmit: Atom.Writable<void, void>
    readonly setValues: Atom.Writable<Field.EncodedFromFields<TFields>>
    readonly getFieldAtoms: <S>(field: FormBuilder.FieldRef<S>) => FormAtoms.PublicFieldAtoms<S>

    readonly mount: Atom.Atom<void>
    readonly KeepAlive: Component<Record<string, never>>
  }
  & FieldComponents<TFields, CM>

type FieldComponents<TFields extends Field.FieldsRecord, CM extends FieldComponentMap<TFields>> = {
  readonly [K in keyof TFields]: TFields[K] extends Field.FieldDef<any, any> ? Component<ExtractExtraProps<CM[K]>>
    : TFields[K] extends Field.ArrayFieldDef<any, infer S>
      ? ArrayFieldComponent<S, ExtractArrayItemExtraProps<CM[K], S>>
    : never
}

type ExtractArrayItemExtraProps<CM, S extends Schema.Schema.Any> = StructFieldsFromSchema<S> extends
  Schema.Struct.Fields ? {
    readonly [K in keyof StructFieldsFromSchema<S>]: CM extends { readonly [P in K]: infer C } ? ExtractExtraProps<C>
      : never
  }
  : CM extends Component<FieldComponentProps<any, infer P>> ? P
  : never

type ArrayFieldComponent<S extends Schema.Schema.Any, ExtraPropsMap> =
  & Component<{
    readonly children: Snippet<[ArrayFieldOperations<Schema.Schema.Encoded<S>>]>
  }>
  & {
    readonly Item: Component<{
      readonly index: number
      readonly children?: Snippet<[{ readonly remove: () => void }]>
    }>
  }
  & (StructFieldsFromSchema<S> extends Schema.Struct.Fields ? {
      readonly [K in keyof StructFieldsFromSchema<S>]: Component<
        ExtraPropsMap extends { readonly [P in K]: infer EP extends Record<string, any> } ? EP
          : Record<string, never>
      >
    }
    : unknown)

// -----------------------------------------------------------------------------
// runtime component factories
// -----------------------------------------------------------------------------

// A Svelte component compiles to a `(internals, props) => exports` function in
// both the client and server output, so a component with pre-bound config can
// be created by delegating to a generic renderer component. The original
// `props` object is forwarded through a getter to preserve fine-grained
// reactivity.
type InternalComponent = (internals: unknown, props: Record<string, any>) => unknown

const withConfig = (renderer: unknown, config: unknown): any => (internals: unknown, props: Record<string, any>) =>
  (renderer as InternalComponent)(internals, {
    config,
    get props() {
      return props
    }
  })

const makeFieldComponent = (
  fieldKey: string,
  schema: Schema.Schema.Any,
  getOrCreateFieldAtoms: (fieldPath: string, schema: Schema.Schema.Any) => FormAtoms.FieldAtoms,
  component: Component<FieldComponentProps<any, any>>,
  onBlurSubmitAtom: Atom.Writable<void, void>
): any =>
  withConfig(FieldRenderer, {
    fieldKey,
    schema,
    getOrCreateFieldAtoms,
    component,
    onBlurSubmitAtom
  })

const makeArrayFieldComponent = (
  fieldKey: string,
  def: Field.ArrayFieldDef<string, Schema.Schema.Any>,
  stateAtom: ArrayFieldRendererConfig["stateAtom"],
  getOrCreateFieldAtoms: (fieldPath: string, schema: Schema.Schema.Any) => FormAtoms.FieldAtoms,
  operations: FormAtoms.FormOperations<any>,
  componentMap: Record<string, Component<FieldComponentProps<any, any>>> | Component<FieldComponentProps<any, any>>,
  onBlurSubmitAtom: Atom.Writable<void, void>
): any => {
  const config: ArrayFieldRendererConfig = {
    fieldKey,
    itemSchema: def.itemSchema,
    stateAtom,
    operations
  }

  const wrapper = withConfig(ArrayFieldRenderer, config)
  wrapper.Item = withConfig(ArrayItemRenderer, config)

  const subFieldDefs = Field.extractStructFieldDefs(def.itemSchema)
  if (subFieldDefs) {
    for (const subDef of subFieldDefs) {
      const itemComponent = (componentMap as Record<string, Component<FieldComponentProps<any, any>>>)[subDef.key]
      wrapper[subDef.key] = makeFieldComponent(
        subDef.key,
        subDef.schema,
        getOrCreateFieldAtoms,
        itemComponent,
        onBlurSubmitAtom
      )
    }
  }

  return wrapper
}

// -----------------------------------------------------------------------------
// make
// -----------------------------------------------------------------------------

export const make: {
  <
    TFields extends Field.FieldsRecord,
    R extends Registry.AtomRegistry,
    A,
    E,
    SubmitArgs = void,
    CM extends FieldComponentMap<TFields> = FieldComponentMap<TFields>
  >(
    self: FormBuilder.FormBuilder<TFields, R>,
    options: {
      readonly runtime?: Atom.AtomRuntime<any, any>
      readonly fields: CM
      readonly mode?: SubmitArgs extends void ? Mode.FormMode : Mode.FormModeWithoutAutoSubmit
      readonly reactivityKeys?: ReadonlyArray<unknown> | Readonly<Record<string, ReadonlyArray<unknown>>> | undefined
      readonly onSubmit: (
        args: SubmitArgs,
        ctx: {
          readonly decoded: Field.DecodedFromFields<TFields>
          readonly encoded: Field.EncodedFromFields<TFields>
          readonly get: Atom.FnContext
        }
      ) => A | Effect.Effect<A, E, R>
    }
  ): BuiltForm<TFields, R, A, E, SubmitArgs, CM>

  <
    TFields extends Field.FieldsRecord,
    R,
    A,
    E,
    SubmitArgs = void,
    ER = never,
    CM extends FieldComponentMap<TFields> = FieldComponentMap<TFields>
  >(
    self: FormBuilder.FormBuilder<TFields, R>,
    options: {
      readonly runtime: Atom.AtomRuntime<R, ER>
      readonly fields: CM
      readonly mode?: SubmitArgs extends void ? Mode.FormMode : Mode.FormModeWithoutAutoSubmit
      readonly reactivityKeys?: ReadonlyArray<unknown> | Readonly<Record<string, ReadonlyArray<unknown>>> | undefined
      readonly onSubmit: (
        args: SubmitArgs,
        ctx: {
          readonly decoded: Field.DecodedFromFields<TFields>
          readonly encoded: Field.EncodedFromFields<TFields>
          readonly get: Atom.FnContext
        }
      ) => A | Effect.Effect<A, E, R>
    }
  ): BuiltForm<TFields, R, A, E, SubmitArgs, CM>
} = (self: any, options: any): any => {
  const { fields: components, mode, onSubmit, reactivityKeys, runtime: providedRuntime } = options
  const runtime = providedRuntime ?? Atom.runtime(Layer.empty)
  const { fields } = self

  const formAtoms = FormAtoms.make({
    formBuilder: self,
    runtime,
    onSubmit,
    reactivityKeys,
    mode
  })

  const {
    autoSubmitAtom,
    combinedSchema,
    fieldRefs,
    getFieldAtoms,
    getOrCreateFieldAtoms,
    hasChangedSinceSubmitAtom,
    isDirtyAtom,
    keepAliveActiveAtom,
    lastSubmittedValuesAtom,
    mountAtom,
    onBlurSubmitAtom,
    operations,
    resetAtom,
    revertToLastSubmitAtom,
    rootErrorAtom,
    setValuesAtom,
    stateAtom,
    submitAtom,
    submitCountAtom,
    validateAtom,
    validationCountAtom,
    valuesAtom
  } = formAtoms

  const Initialize = withConfig(InitializeRenderer, {
    stateAtom,
    validateAtom,
    keepAliveActiveAtom,
    autoSubmitAtom,
    operations
  })

  const KeepAlive = withConfig(KeepAliveRenderer, {
    keepAliveActiveAtom,
    mountAtom
  })

  const fieldComponents: Record<string, any> = {}
  for (const [key, def] of Object.entries(fields as Field.FieldsRecord)) {
    if (Field.isArrayFieldDef(def)) {
      fieldComponents[key] = makeArrayFieldComponent(
        key,
        def,
        stateAtom,
        getOrCreateFieldAtoms,
        operations,
        (components as Record<string, any>)[key],
        onBlurSubmitAtom
      )
    } else if (Field.isFieldDef(def)) {
      fieldComponents[key] = makeFieldComponent(
        key,
        def.schema,
        getOrCreateFieldAtoms,
        (components as Record<string, any>)[key],
        onBlurSubmitAtom
      )
    }
  }

  return {
    values: valuesAtom,
    isDirty: isDirtyAtom,
    hasChangedSinceSubmit: hasChangedSinceSubmitAtom,
    lastSubmittedValues: lastSubmittedValuesAtom,
    submitCount: submitCountAtom,
    validationCount: validationCountAtom,
    rootError: rootErrorAtom,
    schema: combinedSchema,
    fields: fieldRefs,
    Initialize,
    submit: submitAtom,
    validate: validateAtom,
    reset: resetAtom,
    revertToLastSubmit: revertToLastSubmitAtom,
    setValues: setValuesAtom,
    getFieldAtoms,
    mount: mountAtom,
    KeepAlive,
    ...fieldComponents
  }
}
