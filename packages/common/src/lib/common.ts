import {IdAttr, InternalFactRepresentation} from "@edict/types";
import * as objectHash from "object-hash";
import {Set, Dictionary} from "typescript-collections";

export const getIdAttr = <SCHEMA>(fact: InternalFactRepresentation<SCHEMA>):IdAttr<SCHEMA> => {
  // TODO: Good way to assert that fact[1] is actually keyof T at compile time?
  return [fact[0], fact[1] as (keyof SCHEMA)]
}

export const newSet = <T>() => new Set<T>(el => objectHash(el))
export const newDict = <K,V>() => new Dictionary<K,V>((k => objectHash(k)))
