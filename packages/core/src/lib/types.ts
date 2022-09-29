// trick the type-system so we can use the schema like an object
// TODO: If the new API works, maybe we don't need to do this?
export const attr = <T>(): T => undefined as unknown as T;

export type ATTR<SCHEMA> = { [attr in keyof SCHEMA]: SCHEMA[attr] };
export type ConditionOptions<T> = { then?: boolean; match?: T };
export type Condition<SCHEMA> = {
  [ATTR in keyof SCHEMA]: ConditionOptions<SCHEMA[ATTR]>;
};
export type ConditionArgs<SCHEMA> = {
  [key: string]: {
    [ATTR in keyof Partial<SCHEMA>]:
      | { then?: boolean; match?: SCHEMA[ATTR] }
      | undefined;
  };
};

export type EnactArgs<SCHEMA, T extends ConditionArgs<SCHEMA>> = {
  [Key in keyof T]: {
    [ATTR in keyof Required<T[Key]>]: ATTR extends keyof SCHEMA
      ? SCHEMA[ATTR]
      : never;
  } & { id: string };
};

/// Wrap tthe entire what in a function that return something we can enact? Instead of one at a time?
export type InsertEdictFact<SCHEMA> = {
  [key: string]: { [Key in keyof Partial<SCHEMA>]: SCHEMA[Key] };
};

export type EdictOperations<SCHEMA> = {
  insert: (fact: InsertEdictFact<SCHEMA>) => void;
  retract: (id: string, ...attr: (keyof ATTR<SCHEMA>)[]) => void;
};
export type EdictArgs = {
  autoFire?: boolean;
};

export interface IEdict<SCHEMA> {
  insert: (args: InsertEdictFact<SCHEMA>) => void;
  retract: (id: string, ...attrs: (keyof SCHEMA)[]) => void;
  fire: () => void;
  rule: <T extends ConditionArgs<SCHEMA>>(
    name: string,
    conditions: (schema: Condition<SCHEMA>) => T
  ) => {
    enact: (enaction?: {
      then?: (args: EnactArgs<SCHEMA, T>) => void;
      when?: (args: EnactArgs<SCHEMA, T>) => boolean;
      thenFinally?: () => void;
    }) => {
      query: () => EnactArgs<SCHEMA, T>[];
    };
  };
}
