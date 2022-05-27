import {edict, EdictArgs,  InsertEdictFact} from "@edict/core";
import {useEffect, useRef, useState} from "react";

export const useEdict = <SCHEMA,>(args: EdictArgs<SCHEMA>) => {
  const e = useRef(edict(args))

  const {retract: coreRetract, insert: coreInsert, fire: coreFire, addRule } = e.current
  const [dirty, setDirty] = useState(false)
  const fire = () => {

    console.log("fir")
    setDirty(false)
    return coreFire()
  }
  useEffect(() => {
    if(dirty) {
      fire()
    }
  }, [dirty])

  const insert = (fact: InsertEdictFact<SCHEMA>) => {
    setDirty(true)
    return coreInsert(fact)
  }
  const retract = (id: string, ...attrs: (keyof SCHEMA)[]) => {
    setDirty(true)
    return coreRetract(id, ...attrs)
  }


  return {
    retract,
    insert,
    fire,
    addRule
  }
}
