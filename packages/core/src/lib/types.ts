// trick the type-system so we can use the schema like an object
// TODO: If the new API works, maybe we don't need to do this?

import { PRODUCTION_ALREADY_EXISTS_BEHAVIOR } from '@edict/rete';

export type ConditionOptions<T> = { then?: boolean; match?: T; join?: string };
export type Condition<SCHEMA> = {
  [ATTR in keyof SCHEMA]: ConditionOptions<SCHEMA[ATTR]>;
};
export type ConditionArgs<SCHEMA> = {
  [key: string]: {
    [ATTR in keyof Partial<SCHEMA>]: ConditionOptions<SCHEMA[ATTR]> | undefined;
  };
};

export type EnactArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  [Key in keyof T]: {
    [ATTR in keyof Required<T[Key]>]: ATTR extends keyof SCHEMA
      ? SCHEMA[ATTR]
      : never;
  } & { id: string };
};

export type QueryArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  [Key in keyof T]?: {
    [ATTR in keyof Partial<T[Key]>]: ATTR extends keyof SCHEMA
      ? SCHEMA[ATTR][]
      : never;
  } & { ids?: string[] };
};

/// Wrap the entire what in a function that return something we can enact? Instead of one at a time?
export type InsertEdictFact<SCHEMA> = {
  [key: string]: { [Key in keyof Partial<SCHEMA>]: SCHEMA[Key] };
};

export type EdictArgs = {
  autoFire?: boolean;
};

export type EnactionArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  then?: (args: EnactArgs<SCHEMA, T>) => Promise<void> | void;
  when?: (args: EnactArgs<SCHEMA, T>) => boolean;
  thenFinally?: (
    getResults: () => EnactArgs<SCHEMA, T>[]
  ) => Promise<void> | void;
};

export type Enact<SCHEMA, T extends ConditionArgs<SCHEMA>> = (
  enaction?: EnactionArgs<SCHEMA, T>
) => {
  query: (filter?: QueryArgs<SCHEMA, T>) => EnactArgs<SCHEMA, T>[];
  subscribe: (
    fn: (results: EnactArgs<SCHEMA, T>[]) => void,
    filter?: QueryArgs<SCHEMA, T>
  ) => () => void;
};

export interface IEdict<SCHEMA> {
  insert: (args: InsertEdictFact<SCHEMA>) => void;
  retract: (id: string, ...attrs: (keyof SCHEMA)[]) => void;
  fire: (recursionLimit?: number) => void;
  conditions: <T extends ConditionArgs<SCHEMA>>(
    conds: (schema: Condition<SCHEMA>) => T
  ) => T;
  rule: <T extends ConditionArgs<SCHEMA>>(
    name: string,
    conditions: (schema: Condition<SCHEMA>) => T,
    onAlreadyExistsBehaviour?: PRODUCTION_ALREADY_EXISTS_BEHAVIOR
  ) => { enact: Enact<SCHEMA, T> };
  debug: {
    dotFile: () => string;
    perf: () => {
      frames: PerformanceEntryList[];
      capture: () => PerformanceEntryList;
    };
  };
}
