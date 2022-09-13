import {EdictArgs, EdictOperations, IEdict, InsertEdictFact, Rule,} from "./types";
import {groupFactById, insertFactToFact} from "./utils";
import * as _ from "lodash";
import {Binding, InternalFactRepresentation} from "@edict/types";
import {ConvertMatchFn, Field, MatchT, Production, rete} from "@edict/rete"
// TODO: Ideally constrain that any to the value types in the schema someday

export const rule = <T>(r: Rule<T>) => r

export const edict = <SCHEMA>(args: EdictArgs<SCHEMA> ): IEdict<SCHEMA> => {
  const session = rete.initSession<SCHEMA>(args.autoFire ?? false)

  const insert = (insertFacts: InsertEdictFact<SCHEMA>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts)

    factTuples.forEach(f => {
      rete.insertFact<SCHEMA>(session, f)
    })
  }
  const retract = (id: string, ...attrs: (keyof SCHEMA)[]) => {
    attrs.map(attr => {
      rete.retractFactByIdAndAttr<SCHEMA>(session, id, attr)
    })
  }

  const addRule = <T>(fn: (schema: SCHEMA, operations: EdictOperations<SCHEMA>) => Rule<T>) => {
    const rule = fn(args.factSchema, {insert, retract})

    const convertMatchFn: ConvertMatchFn<SCHEMA, Binding<T>> = (args) => {
      // This is where we need to convert the dictionary to the
      // js object we want
      console.log("convert", args)
      return args as any
    }
    const production = rete.initProduction<SCHEMA, Binding<T>>(
      {
        name: rule.name,
        thenFn: (args) =>  {
          console.log(args)
          rule.then?.(args.vars)
        },
        thenFinallyFn: rule.thenFinally,
        condFn: (args) => rule.when?.(convertMatchFn(args)) ?? true,
        convertMatchFn,
      }
    )

    const {what} = rule
    Object.keys(what).forEach(id => {
      const attrs =  _.keys(_.get(what, id)) as [keyof SCHEMA]
      attrs.forEach(attr => {
          const conditionId = (id.startsWith("$")) ? {name: id, field: Field.IDENTIFIER} : id
          const conditionValue = {name: `${id}_${attr}_value`, field: Field.VALUE}
          rete.addConditionsToProduction(production, conditionId, attr, conditionValue, !id.endsWith("_transitive"))
        }
      )
    })
    rete.addProductionToSession(session,production)

    return {query: () => rete.queryAll(session, production), rule: production}
  }

  const fire = () => rete.fireRules(session)

  return {
    insert,
    retract,
    fire,
    addRule
  }
}



