import {edict, FACT_SCHEMA, Rules} from "@edict/core";
import {useEffect, useRef, useState} from "react";

export const useEdict =<T extends FACT_SCHEMA> (rules: Rules<T>, initialFacts?: T[]) => {
  const e = useRef(edict(rules, initialFacts))

  const {query, retract: coreRetract, insert: coreInsert, fire: coreFire, facts} = e.current
  const [dirty, setDirty] = useState(false)

  const fire = () => {
    setDirty(false)
    return coreFire()
  }
  useEffect(() => {
    if(dirty) {
      fire()
    }
  }, [dirty])

  const insert = (fact: T) => {
    setDirty(true)
    return coreInsert(fact)
  }
  const retract = (path: [T[0], T[1]]) => {
    setDirty(true)
    return coreRetract(path)
  }


  return {
    query,
    retract,
    insert,
    fire,
    facts
  }
}
