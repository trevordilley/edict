import {
  ATTR,
  Binding,
  EdictArgs,
  EdictReturn,
  InsertEdictFact,
  InternalFactRepresentation,
  Rule, WHAT,
} from "./types";
import {groupFactById, insertFactToFact} from "./utils";
import * as _ from "lodash";

// TODO: Ideally constrain that any to the value types in the schema someday

// export const rule = <T>(r: Rule<T>) => r

export const edict = <SCHEMA>({factSchema}: EdictArgs<SCHEMA>): EdictReturn<SCHEMA> => {
  const facts: InternalFactRepresentation[] = []
  const rules: Rule<any>[] = []

  const findFact = ([id, attr]: [InternalFactRepresentation[0], InternalFactRepresentation[1]]) => facts.findIndex(f => f[0] == id && f[1] == attr)


  const insert = (insertFacts: InsertEdictFact<SCHEMA>) => {
    // be dumb about this
    const factTuples = insertFactToFact(insertFacts)
    factTuples.forEach(f => {
      const idx = findFact([f[0], f[1]])
      if (idx != -1) {
        facts[idx] = f
      } else {
        facts.push(f)
      }

    })
  }

  const retract = (id: string, ...attrs: (keyof SCHEMA)[]) => {
    attrs.map(attr => {
      const idx = findFact([id, `${attr}`])
      if (idx < 0) return
      facts.splice(idx, 1)
    })
  }

  const matchAttr = (attr: string, facts: InternalFactRepresentation[]) => {
    const filtered = facts.filter(f => f[1] === attr)
    const grouped = _.groupBy(filtered, (f: InternalFactRepresentation) => f[0])
    return Object.values(grouped).flat()
  }


  const matchIdAttr = (id: string, attr: string, facts: InternalFactRepresentation[]) => facts.filter(f => f[0] === id && f[1] === attr)


  const query = <T extends WHAT<SCHEMA>>(rule: Rule<T>): Binding<T>[] => {
    const {what, when} = rule
    const definedFacts = Object.keys(what).map(id => {
      // TODO: string index access is a real pain in typescript!!!
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const attrs = Object.keys(what[id])
      const matchedFacts = attrs.map(attr =>
        (id.startsWith("$")) ? matchAttr(attr, facts) : matchIdAttr(id, attr, facts)
      ).flat()

      const groupedFacts = groupFactById(matchedFacts)
      const correctFacts = Object.keys(groupedFacts).map((key) => {
        const factAttrs = groupedFacts[key].map((f: string) => f[0])
        const hasEverything = _.isEqual(factAttrs, attrs)
        if (hasEverything) {
          return {
            [id]: Object.fromEntries([
              ["id", key], ...groupedFacts[key]
            ])
          }
        } else {

          return undefined
        }
      }).filter((f: any) => f !== undefined)

      return correctFacts
    })

    const length = definedFacts.reduce((acc, c) => acc * c.length, 1)
    const mergedResults = []
    for (let i = 0; i < length; i++) {
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
    return rules.filter(rule => {
      // Don't fire anything without then blocks. Stuff without then
      // blocks are queries and cannot mutate the state of the
      // facts
      const {then, thenFinally} = rule
      return then || thenFinally
    }).map(rule => {
      const {then, thenFinally} = rule
      const results = query(rule)
      // This needs to be recursive and stuff, but for now let's just keep it simple
      // (I think derived facts will require recursive stuff)
      if (then) {
        results.map(f => then(f))
      }
      if (thenFinally) {
        thenFinally()
      }
    })
  }

  // TODO: double arrow for the win?
  const addRule = <T extends WHAT<SCHEMA>>(rl: (schema: ATTR<SCHEMA>) => Rule<T>) => {
    const r = rl(factSchema)
    return {
      query: () => query(r)
    }
  }

  const what = <T extends WHAT<SCHEMA>>(rl: (schema: ATTR<SCHEMA>) => WHAT<T>) => {
     const r = rl(factSchema)
     return {
       then: (args: T) => {console.log(args)},
       finally: () => {console.log("finally")}
     }
  }

  return {
    insert,
    retract,
    fire,
    addRule,
    what
  }
}

// export const edict_old = <S>(args: EdictArgs<S> ) => {
//   const facts = insertFactToFact(args.initialFacts ?? {})
//   const findFact = ([id,attr]: [InternalFactRepresentation[0], InternalFactRepresentation[1]]) => facts.findIndex(f =>f[0] == id && f[1] == attr )
//
//   const insert = (insertFacts: InsertEdictFact<S>) => {
//     // be dumb about this
//     const factTuples = insertFactToFact(insertFacts)
//     factTuples.forEach(f => {
//       const idx = findFact([f[0], f[1]])
//       if(idx != -1) {
//         facts[idx] = f
//       } else {
//         facts.push(f)
//       }
//
//     })
//   }
//   const retract = (id: string, ...attrs: (keyof S)[]) => {
//     attrs.map(attr => {
//       const idx = findFact([id, `${attr}`])
//       if(idx < 0) return
//       facts.splice(idx, 1)
//     })
//   }
//
//   const matchAttr = (attr: string, facts: InternalFactRepresentation[]) => {
//     const filtered = facts.filter(f => f[1] === attr )
//     const grouped = _.groupBy(filtered, (f: InternalFactRepresentation) => f[0])
//     return Object.values(grouped).flat()
//   }
//
//
//   const matchIdAttr = (id: string, attr: string, facts: InternalFactRepresentation[]) => facts.filter(f => f[0] === id && f[1] === attr)
//
//   const rules = args.rules({insert, retract})
//   // TODO: Make typesafe
//   // Needs to return a map from rule-name to results
//   const query = (ruleName: string ) => {
//     const {what, when} = rules[ruleName]
//     const definedFacts = Object.keys(what).map(id => {
//       const attrs = Object.keys(what[id])
//       const matchedFacts = attrs.map(attr =>
//            (id.startsWith("$")) ? matchAttr(attr, facts) : matchIdAttr(id, attr, facts)
//         ).flat()
//
//         const groupedFacts = groupFactById(matchedFacts)
//         const correctFacts = Object.keys(groupedFacts).map((key) => {
//           const factAttrs = groupedFacts[key].map((f:string) => f[0])
//           const hasEverything = _.isEqual(factAttrs, attrs)
//           if(hasEverything) {
//             return  {[id]:  Object.fromEntries([
//                 ["id", key],...groupedFacts[key]
//               ])}
//           } else {
//
//             return undefined
//           }
//         }).filter((f: any) => f !== undefined )
//
//         return  correctFacts
//       })
//
//     const length = definedFacts.reduce((acc, c) => acc * c.length, 1)
//     const mergedResults = []
//     for(let i = 0; i < length; i++) {
//       const f = definedFacts.map(d => d[i % d.length])
//       // TODO: GAH kid's movie is almost over just hack it in!
//       const o: any = {}
//       f.forEach((l: any) => {
//         const k = Object.keys(l)[0]
//         o[k] = l[k]
//       })
//       mergedResults.push(o)
//     }
//     const filtered = when ? mergedResults.filter(when) : mergedResults
//
//     return filtered
//   }
//
//   const fire = () => {
//     const ruleNames = Object.keys(rules)
//     return ruleNames.filter(name => {
//       // Don't fire anything without then blocks. Stuff without then
//       // blocks are queries and cannot mutate the state of the
//       // facts
//       const {then, thenFinally} = rules[name]
//       return then || thenFinally
//     }).map(name => {
//       const { then, thenFinally} = rules[name]
//         const results = query(name)
//        // This needs to be recursive and stuff, but for now let's just keep it simple
//        // (I think derived facts will require recursive stuff)
//        if(then) {
//          results.map(f => then(f))
//        }
//        if(thenFinally) {
//          thenFinally()
//        }
//     })
//   }
//
//
//
//   return {
//     insert,
//     retract,
//     fire,
//     query,
//     facts: () => facts
//   }
// }



