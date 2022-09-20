import {Binding} from "@edict/types";
import {Production} from "@edict/rete";

export const attr = <T>(): T => undefined as unknown as T


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

    autoFire?: boolean
  }

  export enum SCHEMA_AUGMENTATIONS {
    ONCE="ONCE"
  }
export type FULL_SCHEMA<SCHEMA> = {[Key in keyof SCHEMA as `${string & Key}_${typeof SCHEMA_AUGMENTATIONS.ONCE}`]: SCHEMA[Key] } & SCHEMA
export type AddRuleArgs<SCHEMA, T> = (schema: SCHEMA, operations: EdictOperations<SCHEMA>) => Rule<T>
export type AddRuleRet<SCHEMA, T> = { query: () => Binding<T>[], rule: Production<SCHEMA, Binding<T>> }
export type AddRule<SCHEMA> =<T>(fn: AddRuleArgs<SCHEMA, T>) => AddRuleRet<SCHEMA, T>

export interface IEdict<SCHEMA> {
  insert: (args: InsertEdictFact<SCHEMA>) => void,
  retract: (id: string, ...attrs: (keyof SCHEMA)[]) => void
  fire: () => void,
  addRule: AddRule<SCHEMA>,
}
