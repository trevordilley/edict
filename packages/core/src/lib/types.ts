// trick the type-system so we can use the schema like an object
// TODO: If the new API works, maybe we don't need to do this?

import { Debug, PRODUCTION_ALREADY_EXISTS_BEHAVIOR } from '@edict/rete'

type Schemata = {
  Unique: {
    [key: string]: object
  }
  Joins: {
    [key: string]: object
  }
}

export type EDICT<X extends Schemata> = {
  mutate: {
    [Id in keyof X['Unique']]: {
      [Attr in keyof X['Unique'][Id]]: {
        retract: () => void
        insert: (val: X['Unique'][Id][Attr]) => void
      }
    } & {
      insert: (
        attrs: Partial<{
          [Attr in keyof X['Unique'][Id]]: X['Unique'][Id][Attr]
        }>
      ) => void
    }
  } & {
    [Id in keyof X['Joins']]: (id: string) => {
      [Attr in keyof X['Joins'][Id]]: {
        retract: () => void
        insert: (val: X['Joins'][Id][Attr]) => void
      }
    }
  }
}

session.rule('name', ({ Article, $npc: { name, ...rest } }) => ({
  Article,
  $npc: rest,
}))

// const y: UnionToIntersection<{
//   Unique: { A: { z: string } }
//   Joins: { B: { y: string } }
// }> = 'A'
// type Schema<X extends Schemata> = {
//   [Id in keyof X['Unique']]: {
//     [Attr in keyof X['Unique'][Id]]: {
//       [key in Attr]: X['Unique'][Id][Attr]
//     }
//   }
// }

export type ConditionOptions<T> = { then?: boolean; match?: T; join?: string }
export type Condition<SCHEMA> = {
  [ATTR in keyof SCHEMA]: ConditionOptions<SCHEMA[ATTR]>
}
export type ConditionArgs<SCHEMA> = {
  [key: string]: {
    [ATTR in keyof Partial<SCHEMA>]: ConditionOptions<SCHEMA[ATTR]> | undefined
  }
}

export type EnactArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  [Key in keyof T]: {
    [ATTR in keyof Required<T[Key]>]: ATTR extends keyof SCHEMA
      ? SCHEMA[ATTR]
      : never
  } & { id: string }
}

export type QueryArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  [Key in keyof T]?: {
    [ATTR in keyof Partial<T[Key]>]: ATTR extends keyof SCHEMA
      ? SCHEMA[ATTR][]
      : never
  } & { ids?: string[] }
}

/// Wrap the entire what in a function that return something we can enact? Instead of one at a time?
export type InsertEdictFact<SCHEMA> = {
  [key: string]: { [Key in keyof Partial<SCHEMA>]: SCHEMA[Key] }
}

export type EnactionArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  then?: (args: EnactArgs<SCHEMA, T>) => Promise<void> | void
  when?: (args: EnactArgs<SCHEMA, T>) => boolean
  thenFinally?: (
    getResults: () => EnactArgs<SCHEMA, T>[]
  ) => Promise<void> | void
}

export interface QueryOneOptions {
  shouldThrowExceptionOnMoreThanOne?: boolean
}
export type EnactionResults<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  query: (filter?: QueryArgs<SCHEMA, T>) => EnactArgs<SCHEMA, T>[]
  queryOne: (
    filter?: QueryArgs<SCHEMA, T>,
    options?: QueryOneOptions
  ) => EnactArgs<SCHEMA, T> | undefined
  subscribe: (
    fn: (results: EnactArgs<SCHEMA, T>[]) => void,
    filter?: QueryArgs<SCHEMA, T>
  ) => () => void

  subscribeOne: (
    fn: (results: EnactArgs<SCHEMA, T> | undefined) => void,
    filter?: QueryArgs<SCHEMA, T>,
    options?: QueryOneOptions
  ) => () => void
}
export type Enact<SCHEMA, T extends ConditionArgs<SCHEMA>> = (
  enaction?: EnactionArgs<SCHEMA, T>
) => EnactionResults<SCHEMA, T>

export interface IEdict<SCHEMA> {
  insert: (args: InsertEdictFact<SCHEMA>) => void
  retract: (id: string, ...attrs: (keyof SCHEMA)[]) => void
  retractByConditions: (
    id: string,
    conditions: { [key in keyof SCHEMA]?: any }
  ) => void
  fire: (recursionLimit?: number) => void
  reset: () => void
  conditions: <
    T extends {
      [ATTR in keyof Partial<SCHEMA>]:
        | ConditionOptions<SCHEMA[ATTR]>
        | undefined
    }
  >(
    conds: (schema: Condition<SCHEMA>) => T
  ) => T
  rule: <T extends ConditionArgs<SCHEMA>>(
    name: string,
    conditions: (schema: Condition<SCHEMA>) => T,
    onAlreadyExistsBehaviour?: PRODUCTION_ALREADY_EXISTS_BEHAVIOR
  ) => { enact: Enact<SCHEMA, T> }
  debug: {
    dotFile: () => string
    engineDebug?: Debug<SCHEMA>
    perf: () => {
      frames: PerformanceEntryList[]
      capture: () => PerformanceEntryList
    }
  }
}
