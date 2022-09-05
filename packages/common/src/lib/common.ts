import {IdAttr, InternalFactRepresentation} from "@edict/types";

export const getIdAttr = <SCHEMA>(fact: InternalFactRepresentation<SCHEMA>):IdAttr<SCHEMA> => {
  // TODO: Good way to assert that fact[1] is actually keyof T at compile time?
  return [fact[0], fact[1] as (keyof SCHEMA)]
}

