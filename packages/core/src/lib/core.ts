import {Binding, EdictArgs, EdictOperations, IEdict, InsertEdictFact, InternalFactRepresentation, Rule,} from "./types";
import {groupFactById, insertFactToFact} from "./utils";
import * as _ from "lodash";

// TODO: Ideally constrain that any to the value types in the schema someday

export const rule = <T>(r: Rule<T>) => r

export const edict = <S>(args: EdictArgs<S> ): IEdict<S> => {
  const facts: InternalFactRepresentation[] = []
  const findFact = ([id,attr]: [InternalFactRepresentation[0], InternalFactRepresentation[1]]) => facts.findIndex(f =>f[0] == id && f[1] == attr )

  const insert = (insertFacts: InsertEdictFact<S>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts)
    factTuples.forEach(f => {
      const idx = findFact([f[0], f[1]])
      if(idx != -1) {
        facts[idx] = f
      } else {
        facts.push(f)
      }

    })
  }
  const retract = (id: string, ...attrs: (keyof S)[]) => {
    attrs.map(attr => {
      const idx = findFact([id, `${attr}`])
      if(idx < 0) return
      facts.splice(idx, 1)
    })
  }

  const matchAttr = (attr: string, facts: InternalFactRepresentation[]) => {
    const filtered = facts.filter(f => f[1] === attr )
    const grouped = _.groupBy(filtered, (f: InternalFactRepresentation) => f[0])
    return Object.values(grouped).flat()
  }


  const matchIdAttr = (id: string, attr: string, facts: InternalFactRepresentation[]) => facts.filter(f => f[0] === id && f[1] === attr)

  const rules: {[key: string]: Rule<any>} = {}
  const addRule = <T>(fn: ( schema: S, operations: EdictOperations<S>) => Rule<T>) => {
    const rule = fn(args.factSchema, {insert, retract})
    rules[rule.name] = rule
    console.log("adding rules", rules)
    return {query: () => query(rule), rule}
  }
  // TODO: Make typesafe
  // Needs to return a map from rule-name to results
  const query = <T>(rule: Rule<T> ): Binding<T>[] => {
    const {what, when} = rule
    const definedFacts = Object.keys(what).map(id => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const attrs = Object.keys(what[id])
      const matchedFacts = attrs.map(attr =>
           (id.startsWith("$")) ? matchAttr(attr, facts) : matchIdAttr(id, attr, facts)
        ).flat()

        const groupedFacts = groupFactById(matchedFacts)
        const correctFacts = Object.keys(groupedFacts).map((key) => {
          const factAttrs = groupedFacts[key].map((f:string) => f[0])
          const hasEverything = _.isEqual(factAttrs, attrs)
          if(hasEverything) {
            return  {[id]:  Object.fromEntries([
                ["id", key],...groupedFacts[key]
              ])}
          } else {

            return undefined
          }
        }).filter((f: any) => f !== undefined )

        return  correctFacts
      })

    const length = definedFacts.reduce((acc, c) => acc * c.length, 1)
    const mergedResults = []
    for(let i = 0; i < length; i++) {
      const f = definedFacts.map(d => d[i % d.length])
      // TODO: GAH kid's movie is almost over just hack it in!
      const o: any = {}
      f.forEach((l: any) => {
        const k = Object.keys(l)[0]
        o[k] = l[k]
      })
      mergedResults.push(o)
    }
    const filtered = when ? mergedResults.filter(when) : mergedResults

    return filtered as unknown as Binding<T>[]
  }

  const fire = () => {
    const ruleNames = Object.keys(rules)
    return ruleNames.filter(name => {
      // Don't fire anything without then blocks. Stuff without then
      // blocks are queries and cannot mutate the state of the
      // facts
      const {then, thenFinally} = rules[name]
      return then || thenFinally
    }).map(name => {
      const rule = rules[name]
        const results = query(rule)
       // This needs to be recursive and stuff, but for now let's just keep it simple
       // (I think derived facts will require recursive stuffi)
      const {then, thenFinally} = rule
       if(then) {
         results.map((f: any) => then(f))
       }
       if(thenFinally) {
         thenFinally()
       }
    })
  }



  return {
    insert,
    retract,
    fire,
    query,
    facts: () => facts,
    addRule
  }
}



