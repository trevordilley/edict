import {EdictArgs, EdictOperations, FULL_SCHEMA, IEdict, InsertEdictFact, Rule, SCHEMA_AUGMENTATIONS,} from "./types";
import { insertFactToFact} from "./utils";
import * as _ from "lodash";
import {Binding} from "@edict/types";
import {ConvertMatchFn, Field, rete} from "@edict/rete"
// TODO: Ideally constrain that any to the value types in the schema someday

export const rule = <T>(r: Rule<T>) => r

const ID_PREFIX = "id___"
const VALUE_PREFIX = "val___"
const idPrefix = (i: string) => `${ID_PREFIX}${i}`
export const edict = <SCHEMA>(args: EdictArgs<SCHEMA> ): IEdict<FULL_SCHEMA<SCHEMA>> => {
  const session = rete.initSession<FULL_SCHEMA<SCHEMA>>(args.autoFire ?? false)

  const insert = (insertFacts: InsertEdictFact<FULL_SCHEMA<SCHEMA>>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts)

    factTuples.forEach(fact => {
      rete.insertFact<FULL_SCHEMA<SCHEMA>>(session, fact)
    })
  }
  const retract = (id: string, ...attrs: (keyof FULL_SCHEMA<SCHEMA>)[]) => {
    attrs.map(attr => {
      rete.retractFactByIdAndAttr<FULL_SCHEMA<SCHEMA>>(session, id, attr)
    })
  }

  const addRule = <T>(fn: (schema: FULL_SCHEMA<SCHEMA>, operations: EdictOperations<FULL_SCHEMA<SCHEMA>>) => Rule<T>) => {
    const rule = fn(args.factSchema as FULL_SCHEMA<SCHEMA>, {insert, retract})

    const convertMatchFn: ConvertMatchFn<FULL_SCHEMA<SCHEMA>, Binding<T>> = (args) => {
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
    const production = rete.initProduction<FULL_SCHEMA<SCHEMA>, Binding<T>>(
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
    const conditions: string[] = []
    Object.keys(what).forEach(id => {
      const attrs =  _.keys(_.get(what, id)) as [keyof FULL_SCHEMA<SCHEMA>]
      attrs.forEach(attr => {
          const value = _.get(what, `${id}.${attr}`)
          const conditionId = (id.startsWith("$")) ? {name: idPrefix(id), field: Field.IDENTIFIER} : id
          const attrName = `${attr}`.replace(`_${SCHEMA_AUGMENTATIONS.ONCE}`, "") as (keyof FULL_SCHEMA<SCHEMA>)
          const isThen = !`${attr}`.endsWith(SCHEMA_AUGMENTATIONS.ONCE)
          const conditionValue = value ?? {name: `${VALUE_PREFIX}${id}_${attrName}`, field: Field.VALUE}
          conditions.push(`addConditionsToProduction(production, ${JSON.stringify(conditionId)}, ${attrName}, ${JSON.stringify(conditionValue)}, ${isThen})`)
          rete.addConditionsToProduction(production, conditionId, attrName , conditionValue, isThen)
        }
      )
    })
    console.log(conditions.join("\n"))
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



