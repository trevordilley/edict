import React, {FC, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import {Condition, ConditionArgs, Enact, EnactArgs, EnactionArgs, IEdict, InsertEdictFact} from "@edict/core";
import {PRODUCTION_ALREADY_EXISTS_BEHAVIOR} from "@edict/rete";

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
    const {retract: coreRetract, insert: coreInsert, fire: coreFire, rule: coreRule, ...rest } = e
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
    const useRule = (name: string, rule:(schema: Condition<SCHEMA>) => ConditionArgs<SCHEMA>) => {
      console.log(`Adding ${name}`)
      const r = coreRule(name, rule, PRODUCTION_ALREADY_EXISTS_BEHAVIOR.QUIET)
      const id = useRef(`${getSubId()}-${name}`)
      const {enact: coreEnact} = r

      const [results, setResults] = useState<EnactArgs<SCHEMA, ConditionArgs<SCHEMA>>[] | undefined>([])
      const [retrieve, setRetrieve] = useState(false)
      const query = useRef<() => EnactArgs<SCHEMA, ConditionArgs<SCHEMA>>[] | undefined>()
      const enact = (enaction?: EnactionArgs<SCHEMA, ConditionArgs<SCHEMA>>) => {
        if(query.current) return
        const {query: coreQuery} = coreEnact(enaction)
        query.current = coreQuery
      }

      const onRetrieve = () => {
        if(!query.current) return
        console.log("query ", query.current)
        const results = query.current()
        setResults(results)
        setRetrieve(!retrieve)
      }
      useEffect(() => {
        subs.set(id.current, onRetrieve)
          return () => {
            subs.delete(id.current)
            }
        }, [])

      return { enact, results}
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


