import React, {FC, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import {AddRuleArgs, IEdict, InsertEdictFact} from "@edict/core";

let currentSubId = 0
const getSubId = () => {
  currentSubId += 1
  return currentSubId
}
const subs = new Map<string, () => void>()
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
        console.log("keys", Object.keys(subs))
        subs.forEach(fn => fn())
        console.log(subs)
      }
    }, [dirty])
    const useRule = <T,>(rule: AddRuleArgs<SCHEMA, T>) => {
      const { query, rule: addedRule } = coreAddRRule(rule)
      const id = useRef(`${getSubId()}-${addedRule.name}`)
      const [results, setResults] = useState(query())
      const [retrieve, setRetrieve] = useState(false)
      const onRetrieve = () => {
        setResults(query())
        setRetrieve(!retrieve)
      }
      useEffect(() => {
        subs.set(id.current, onRetrieve)
          return () => {
            subs.delete(id.current)
            }
        }, [])



      return results
    }
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


