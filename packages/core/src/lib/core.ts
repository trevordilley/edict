import {FACT_SCHEMA, Rules, WHAT_SCHEMA} from "./types";
import {groupFactById, groupRuleById} from "./utils";
import * as _ from "lodash";

export const edict =<T extends FACT_SCHEMA> (rules: Rules<T>, initialFacts?: T[]) => {

  const facts: T[] = initialFacts ?? []
  const findFact = ([id,attr]: [T[0], T[1]]) => facts.findIndex(f =>f[0] == id && f[1] == attr )


  const insert = (fact: T) => {
    // be dumb about thiis
    const idx = findFact([fact[0], fact[1]])
    console.log("inserting", idx, fact)
    if(idx != -1) {
      facts[idx] = fact
    } else {
      facts.push(fact)
    }
  }
  const retract = (path: [T[0], T[1]]) => {
    const idx = findFact(path)
    if(idx < 0) return
    facts.splice(idx, 1)
  }

  // const ruleSet:Rules<FactSchema> = {
  //   "NPC with 0 health is dying": {
  //     what: [
  //       ["$npc", "health"],
  //       ["global", "time"]
  //     ],
  //     when: ({$npc}: any) => $npc.health <= 0,
  //     then: ({$npc }: any, {insert, retract} ) => {
  //       retract([$npc.id, "health"])
  //       insert([$npc.id, "isDying", true])
  //     }
  //   },
  //   "Dying npcs play death animation": {
  //     what: [
  //       ["$npc", "isDying"],
  //       ["time", "dt"]
  //     ],
  //     then:({$npc, time}) => {console.log($npc.isDying, time.dt)}
  //   }
  // }

  const matchAttr = (attr: string, facts: T[]) => {
    const filtered = facts.filter(f => f[1] === attr)
    const grouped = _.groupBy(filtered, (f: T) => f[0])
    return Object.values(grouped).flat()
  }


  const matchIdAttr = (id: string, attr: string, facts: T[]) => facts.filter(f => f[0] === id && f[1] === attr)

  // Needs to return a map from rule-name to results
  const fire = () => {
    const ruleNames = Object.keys(rules)
     return ruleNames.map(name => {
      const {what, when, then, thenFinally} = rules[name]
      const byId = groupRuleById(what)
      const definedFacts = Object.keys(byId).map(id => {
        const attrs = byId[id]
        const matchedFacts = attrs.map((a:string) => {
          return (id.startsWith("$")) ? matchAttr(a, facts) : matchIdAttr(id, a, facts)
        }).flat()

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

       // This needs to be recursive and stuff, but for now let's just keep it simple
       // (I think derived facts will require recursive stuff)
       const operations = {insert, retract}
       if(then) {
         filtered.map(f => then(f, operations))
       }
       if(thenFinally) {
         filtered.map(f => thenFinally(f, operations))
       }
    })
  }



  return {
    insert,
    retract,
    fire,
    facts: () => facts
  }
}



