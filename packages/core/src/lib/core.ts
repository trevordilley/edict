import {EdictArgs, EdictOperations, IEdict, InsertEdictFact, Rule,} from "./types";
import {groupFactById, insertFactToFact} from "./utils";
import * as _ from "lodash";
import {Binding, InternalFactRepresentation} from "@edict/types";
import {ConvertMatchFn, Field, MatchT, Production, rete} from "@edict/rete"
// TODO: Ideally constrain that any to the value types in the schema someday

export const rule = <T>(r: Rule<T>) => r

const ID_PREFIX = "id___"
const VALUE_PREFIX = "val___"
const idPrefix = (i: string) => `${ID_PREFIX}${i}`
export const edict = <SCHEMA>(args: EdictArgs<SCHEMA> ): IEdict<SCHEMA> => {
  const session = rete.initSession<SCHEMA>(args.autoFire ?? false)

  const insert = (insertFacts: InsertEdictFact<SCHEMA>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts)

    factTuples.forEach(fact => {
      rete.insertFact<SCHEMA>(session, fact)
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
      const result = {}

      args.forEach((_, k) => {
        if(k.startsWith(ID_PREFIX)) {
          const id = k.replace(ID_PREFIX, "")
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          result[id] = {id: args.get(k)}
        }
      })

      args.forEach((_,k) => {
        if(k.startsWith(VALUE_PREFIX)) {
          const value = k.replace(VALUE_PREFIX, "")
          const [id, attr] = value.split("_")
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if(!result[id]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            result[id] = {id}
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          result[id][attr] = args.get(k)
        }
      })

      return result as Binding<T>
    }
    const production = rete.initProduction<SCHEMA, Binding<T>>(
      {
        name: rule.name,
        thenFn: (args) =>  {
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
          const conditionId = (id.startsWith("$")) ? {name: idPrefix(id), field: Field.IDENTIFIER} : id
          const conditionValue = {name: `${VALUE_PREFIX}${id}_${attr}`, field: Field.VALUE}
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



