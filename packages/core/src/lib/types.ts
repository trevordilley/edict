import {Binding} from "@edict/types";
import {Production} from "@edict/rete";

// trick the type-system so we can use the schema like an object
// TODO: If the new API works, maybe we don't need to do this?
export const attr = <T>(): T => undefined as unknown as T


export type ATTR<SCHEMA> = {[attr in keyof SCHEMA]: SCHEMA[attr]}
export type ConditionOptions<T> = {then?: boolean, match?: T}
export type Condition<SCHEMA> = {[ATTR in keyof SCHEMA]: ConditionOptions<SCHEMA[ATTR]>}
export type ConditionArgs<SCHEMA> = {
  [key: string]: {
    [ATTR in keyof Partial<SCHEMA>]: {then?: boolean, match?: SCHEMA[ATTR]} | undefined
  }
}

export type EnactArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  [Key in keyof T]: {
    [ATTR in keyof T[Key]]: ATTR extends keyof SCHEMA ? SCHEMA[ATTR]  : never
  } & {id: string}
}


const session = <SCHEMA>(schema: SCHEMA, autoFire = false) => {
  console.log(autoFire)
  const rule = <T extends ConditionArgs<SCHEMA>>(name: string, conditions: (schema: Condition<SCHEMA>) => T) => {
      const enact = (args: {then?: (args: EnactArgs<SCHEMA, T>) => void}) => {
        return { query: () => true}
      }

      return { enact }
  }

  const fire = () => 2
  const insert = () => 3
  const retract = () => 4
  return {rule, fire, insert, retract}
}

const {rule: rule2} = session({x: attr<number>()})
rule2("blah", ({x}) => ({"hi": { x }}))
  .enact({then: (args) => {console.log(args.hi.id)}})

/// Wrap tthe entire what in a function that return something we can enact? Instead of one at a time?
export interface Rule< T> {
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



export type AddRuleArgs<SCHEMA, T> = (schema: SCHEMA, operations: EdictOperations<SCHEMA>) => Rule<T>


export type AddRuleRet<SCHEMA, T> = { query: () => Binding<T>[], rule: Production<SCHEMA, Binding<T>> }



export type AddRule<SCHEMA> =<T>(fn: AddRuleArgs<SCHEMA, T>) => AddRuleRet<SCHEMA, T>

// TODO: Ideally constrain that any to the value types in the schema someday
export const rule = <T>(r: Rule<T>) => r


export interface IEdict<SCHEMA> {
  insert: (args: InsertEdictFact<SCHEMA>) => void,
  retract: (id: string, ...attrs: (keyof SCHEMA)[]) => void
  fire: () => void,
  addRule: AddRule<SCHEMA>,
  newRule: <T extends ConditionArgs<SCHEMA>>(name: string, conditions: (schema: Condition<SCHEMA>) => T ) => ({
    enact: (enaction?: {
      then?: (args: EnactArgs<SCHEMA, T> ) => void,
      when?: (args: EnactArgs<SCHEMA, T>) => boolean,
      thenFinally?: () => void
    }) => ({
      query: () => EnactArgs<SCHEMA, T>[]
    })
  })
}
