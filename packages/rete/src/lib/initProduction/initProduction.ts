import {
  CondFn,
  ConvertMatchFn,
  Production,
  ThenAllFn,
  ThenFinallyFn,
  ThenFn,
} from '@edict/rete'

export const initProduction = <SCHEMA, U>(production: {
  name: string
  convertMatchFn: ConvertMatchFn<SCHEMA, U>
  condFn?: CondFn<SCHEMA>
  thenFn?: ThenFn<SCHEMA, U>
  thenAllFn?: ThenAllFn<SCHEMA, U>
  thenFinallyFn?: ThenFinallyFn<SCHEMA, U>
}): Production<SCHEMA, U> => {
  return {
    ...production,
    conditions: [],
    subscriptions: new Set(),
  }
}
