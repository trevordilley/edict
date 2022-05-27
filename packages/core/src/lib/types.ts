
export interface TypeOptions {
  then?: boolean
}
// use trickery and mischief to force the return type to a primitive for type
// inference. In the guts of the logic we'll actually pull the options out of the
// return to inspect them, but the compiler doesn't need to know that!
export const attr = <T>(options?: TypeOptions): T => options as unknown as T


type Binding<T> = {[Key in keyof T]:
  Required<T[Key]> & {id: string }}

export type ATTR<SCHEMA> = {[attr in keyof SCHEMA]: SCHEMA[attr]}
export interface Rule<T> {
  name: string,
  what: T,
  when?: (arg: Binding<T> ) => boolean,
  then?: (arg: Binding<T> ) => void,
  thenFinally?: () => void
}
export type InsertEdictFact<SCHEMA> = {
  [key: string]: { [Key in keyof Partial<SCHEMA>]: SCHEMA[Key] }
}

export type EdictOperations<SCHEMA> = {
  insert: (fact: InsertEdictFact<SCHEMA>) => void
  retract: (id: string, ...attr: (keyof ATTR<SCHEMA>)[]) => void
}
export type EdictArgs<SCHEMA> =
  {
    // We can't enforce the Schema in the `then` and `when` blocks at compile time,
    // so we'll just be sure to do a runtime check on boot if there are rules that
    // have `what` blocks with attrs that aren't in the schema!
    factSchema: SCHEMA
  }

export type InternalFactRepresentation = [string, string, any]
