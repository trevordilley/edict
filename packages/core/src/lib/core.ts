import {FACT_SCHEMA, Rules} from "./types";

export const edict =<T extends FACT_SCHEMA> (rules: Rules<T>, initialFacts?: T[]) => {

  const facts: T[] = initialFacts ?? []
  const findFact = ([id,attr]: [T[0], T[1]]) => facts.findIndex(f =>f[0] == id && f[1] == attr )

  const insert = (fact: T) => {
    // be dumb about this
    const idx = findFact([fact[0], fact[1]])
    if(idx != -1) {
      facts[idx] = fact
    } else {
      facts.concat(fact)
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

  const matchAttr = (attr: string, facts: T[]) => facts.filter(f => f[1] === attr)
  const matchIdAttr = (id: string, attr: string, facts: T[]) => facts.filter(f => f[0] === id && f[1] === attr)



  const match = (facts: T[]) => {
    const ruleNames = Object.keys(rules)
    ruleNames.map(name => {
      const {what} = rules[name]
      what.map(w => {
        const [id, attr] = w
        const matches = (id.startsWith("$")) ? matchAttr(attr, facts) : matchIdAttr(id, attr, facts)
      })
    })
    console.log(facts)
    return false
  }


  const fire = (): any => {
    return match(facts)
  }

  return {
    insert,
    retract,
    fire,
  }
}



