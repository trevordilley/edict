import React, {FC, PropsWithChildren, useCallback, useContext, useEffect, useState} from "react";
import {AddRuleArgs, IEdict, InsertEdictFact} from "@edict/core";

const createContext = <SCHEMA,>(args: IEdict<SCHEMA>) =>
   React.createContext(args)
export const invokeEdict = <SCHEMA,>(args: IEdict<SCHEMA>) => {
  const EdictContext = createContext(args)


  const useEdict = () => {
    const e = useContext(EdictContext)

    const {retract: coreRetract, insert: coreInsert, fire: coreFire, addRule: coreAddRRule, ...rest } = e
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
    const useRule = <T,>(rule: AddRuleArgs<SCHEMA, T>) => useCallback(() => coreAddRRule(rule), [dirty])
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
      useRule,
      ...rest
    }
  }



  const Edict:FC<PropsWithChildren<unknown>>  = (props) => (<EdictContext.Provider value={args}>
    {props.children}
  </EdictContext.Provider>)

  return {Edict, useEdict}
}


