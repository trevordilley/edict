// TODO: lol make this adhere to the schema?
export type InternalFactRepresentation<SCHEMA> = [string, keyof SCHEMA, any]

export type Binding<T> = {[Key in keyof T]:
  Required<T[Key]> & {id: string }}

export type IdAttr<S> = [string, keyof S]
export type IdAttrs<S> = IdAttr<S>[]
