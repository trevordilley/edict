export interface TypeOptions {
  then?: boolean
}

// use trickery and mischief to force the return type to a primitive for type
// inference. In the guts of the logic we'll actually pull the options out of the
// return to inspect them, but the compiler doesn't need to know that!
export const AttrTypes = {
  bool: (options?: TypeOptions): boolean => options as unknown as boolean,
  num: (options?: TypeOptions): number => options as unknown as number,
  str: (options?: TypeOptions): string => options as unknown as string,
  object: (options?: TypeOptions): object => options as unknown as object,
  date: (options?: TypeOptions) => options as unknown as Date,
}

export interface RuleSet {
  [key: string]: Rule<any>
}

export type Binding<T> = {
  [Key in keyof T]:
  Required<T[Key]> & { id: string }
}

export type ATTR<SCHEMA> = { [attr in keyof SCHEMA]: SCHEMA[attr] }
export type WHAT<SCHEMA> = { [key: string]: Partial<ATTR<SCHEMA>> }

export interface Rule<T> {
  what: T,
  when?: (arg: Binding<T>) => boolean,
  then?: (arg: Binding<T>) => void,
  thenFinally?: () => void
}

export type InsertEdictFact<SCHEMA> = {
  [key: string]: { [Key in keyof Partial<SCHEMA>]: SCHEMA[Key] }
}
export type EdictArgs<SCHEMA> =
  {
    factSchema: SCHEMA
  }

export type EdictReturn<SCHEMA> =
  {
    insert: (fact: InsertEdictFact<SCHEMA>) => void
    retract: (id: string, ...attr: (keyof ATTR<SCHEMA>)[]) => void
    addRule: <T extends WHAT<SCHEMA>>(ruleFn: (schema: ATTR<SCHEMA>) => Rule<T>) => ({query: () => Binding<T>[]})
    what: <T extends WHAT<SCHEMA>>(ruleFn: (schema: ATTR<SCHEMA>) => WHAT<T>) => ({then: (args: T) => void, finally: () => void})
      fire: () => void
  }

export type Edict<SCHEMA> = (args: EdictArgs<SCHEMA>) => EdictReturn<SCHEMA>

export type InternalFactRepresentation = [string, string, any]
