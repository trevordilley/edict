import {edict} from "./core";

export interface TypeOptions {
  then?: boolean
}
// use trickery and mischief to force the return type to a primitive for type
// inference. In the guts of the logic we'll actually pull the options out of the
// return to inspect them, but the compiler doesn't need to know that!
export const AttrTypes = {
  bool : (options?: TypeOptions):boolean => options as unknown as boolean,
  num : (options?: TypeOptions):number => options as unknown as number,
  str : (options?: TypeOptions): string => options as unknown as string,
  object : (options?: TypeOptions): object => options as unknown as object,
  date : (options?: TypeOptions) => options as unknown as Date,
}

export interface RuleSet {
  [key: string]: Rule<any>
}

type Binding<T> = {[Key in keyof T]:
  Required<T[Key]> & {id: string }}

export type ATTR<SCHEMA> = {[attr in keyof SCHEMA]: SCHEMA[attr]}
export interface Rule<T> {
  what: T,
  when?: (arg: Binding<T> ) => boolean,
  then?: (arg: Binding<T> ) => void,
  thenFinally?: () => void
}
export type InsertEdictFact<SCHEMA> = {
  [key: string]: { [Key in keyof Partial<SCHEMA>]: SCHEMA[Key] }
}
export type EdictArgs<SCHEMA> =
  {
    // We can't enforce the Schema in the `then` and `when` blocks at compile time,
    // so we'll just be sure to do a runtime check on boot if there are rules that
    // have `what` blocks with attrs that aren't in the schema!
    factSchema: SCHEMA

    rules: (operations: {
      insert: (fact: InsertEdictFact<SCHEMA>) => void
      retract: (id: string, attr: keyof ATTR<SCHEMA>) => void
    }) => RuleSet,
    initialFacts?: InsertEdictFact<SCHEMA>
  }

export type InternalFactRepresentation = [string, string, any]
