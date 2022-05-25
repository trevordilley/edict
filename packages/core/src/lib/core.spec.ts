import {AttrTypes, edict, rule, RuleSet} from "@edict/core";
import * as _ from "lodash";

export type NpcId = string
export type NpcFactSchema =
  [NpcId, "x" | "y" | "health", number]
  | [NpcId, "value", number]
  | [NpcId, "isDying" | "isEvil", boolean]
export type TimeFactSchema = ["time", "dt" | "elapsed", number]
export type  FactSchema = NpcFactSchema | TimeFactSchema

const rules: RuleSet = {}

const playerFacts =
  {
    player: {
      x: 10,
      y: 10,
      health: 100
    }
  }

const treasureFacts = {
  treasure1: {x: 12, y: -1, value: 100},
  treasure2: {x: 2, y: 21, value: 3230}
}


const villagerFacts = {
  villager: {
    x: 30,
    y: 120,
    health: 30
  }
}

const enemyFacts = {
  enemy1: {
    x: 0,
    y: 120,
    health: 5,
    isEvil: true
  },
  enemy2: {
    x: -10,
    y: 12,
    health: 0,
    isEvil: true
  }
}

const treeFacts = {
  tree: {
    x: 0,
    y: 120
  }
}

const timeFacts = {
  time: {
    dt: 15
  }
}

const allFacts = {
   ...playerFacts,
  ...enemyFacts,
   ...villagerFacts,
  ...treasureFacts,
  ...treeFacts,
  ...timeFacts
}


const mkEdict = () => edict({
  factSchema: {
    health: AttrTypes.num(),
    isDying: AttrTypes.bool(),
    dt: AttrTypes.num(),
    value: AttrTypes.num(),
    x: AttrTypes.num(),
    y: AttrTypes.num(),
    isEvil: AttrTypes.bool()
  },
  rules: ({insert, retract}) => ({

    "all_treasure": rule({
      what: {
        $treasure: {
          value: AttrTypes.num(),
          x: AttrTypes.num(),
          y: AttrTypes.num()
        }
      }
    }),
    "all_npcs": rule({
      what: {
        $npc: {
          health: AttrTypes.num(),
          x: AttrTypes.num(),
          y: AttrTypes.num(),
        },
        time: {
          dt: AttrTypes.num()
        }
      }
    }),
    "no_health_is_dying": rule({
      what: {
        $npc: {
          health: AttrTypes.num()
        }
      },
      when: ({$npc}) => $npc.health <= 0,
      then: ({$npc}) => {
        retract($npc.id, "health")
        insert({[$npc.id]: {isDying: true}})
      }
    }),
    "is_dying": rule({
      what: {
        $npc: {
          isDying: AttrTypes.bool()
        }
      },
      when: ({$npc}) => $npc.isDying,
    }),
    "complicated_nonsense": rule({
      what: {
        $npc: {
          health: AttrTypes.bool(),
          x: AttrTypes.num(),
          y: AttrTypes.num()
        },
        $treasure: {
          value: AttrTypes.num(),
          x: AttrTypes.num(),
          y: AttrTypes.num()
        },
        time: {
          dt: AttrTypes.num()
        }
      }
    }),
  })
})

describe('edict', () => {
  it('complicated happy path is happy', () => {
    const e = mkEdict()
    e.insert(allFacts)
    e.fire()

    const results: any = e.query("is_dying")
    console.log("results", results)
    const expectedResults = [
      {$npc: {id: "enemy2", "isDying": true}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });


  it('Missing fact will result in empty array', () => {
    // None of the players are dying, so if those are the only facts the
    // the is_dying rule should be empty
    const e = mkEdict()
    e.insert(playerFacts)
    e.fire()

    const results = e.query("is_dying")
    expect(results).toStrictEqual([]);
  });

  it('Retracting facts works', () => {
    const e = mkEdict()
    const facts = {
      ...playerFacts,
      ...villagerFacts,
      ...timeFacts
    }
    e.insert(facts)
    const beforeRetract = e.query("all_npcs")
    const expectedBeforeRetract = [
      {$npc: {id: "player", health: 100, x: 10, y: 10}, time: {id: "time", dt: 15}},
      {$npc: {id: "villager", health: 30, x: 30, y: 120}, time: {id: "time", dt: 15}},
    ]
    expect(beforeRetract).toStrictEqual(expectedBeforeRetract);
    e.retract("villager", "x", "y", "health" )
    const results = e.query("all_npcs")
    const expectedResults = [
      {$npc: {id: "player", health: 100, x: 10, y: 10}, time: {id: "time", dt: 15}},
      // No villager facts
    ]
    expect(results).toStrictEqual(expectedResults);
  });
});
