import {edict, Rules} from "@edict/core";

export type NpcId = string
export type NpcFactSchema =
  [NpcId, "x" | "y" | "health", number]
  | [NpcId, "value", number]
  | [NpcId, "isDying" | "isEvil", boolean]
export type TimeFactSchema = ["time", "dt" | "elapsed", number]
export type  FactSchema = NpcFactSchema | TimeFactSchema

const ruleSet: Rules<FactSchema> = {
  "all_treasure": {
    what: [
      ["$treasure", "value"],
      ["$treasure", "x"],
      ["$treasure", "y"],
    ],
  },
  "all_npcs": {
    what: [
      ["$npc", "health"],
      ["$npc", "x"],
      ["$npc", "y"],
    ],
  },
  "no_health_is_dying": {
    what: [
      ["$npc", "health"],
    ],
    when: (obj: any) => obj.$npc.health <= 0,
    then: (obj: any, {insert, retract}) => {
      retract([obj.$npc.id, "health"])
      insert([obj.$npc.id, "isDying", true])
    }
  },
  "is_dying": {
    what: [
      ["$npc", "isDying"],
    ],
    when: (obj: any) => obj.$npc.isDying,
  },
  "complicated_nonsense": {
    what: [
      ["$npc", "health"],
      ["$npc", "x"],
      ["$npc", "y"],
      ["$treasure", "value"],
      ["$treasure", "x"],
      ["$treasure", "y"],
      ["time", "dt"],
    ],
  },
}


const playerFacts: FactSchema[] = [
  ["player", "x", 10],
  ["player", "y", 10],
  ["player", "health", 100]
]

const treasureFacts: FactSchema[] = [
  ["treasure1", "x", 12],
  ["treasure1", "y", -1],
  ["treasure1", "value", 100],
  ["treasure2", "x", 2],
  ["treasure2", "y", 21],
  ["treasure2", "value", 3230],
]

const enemyFacts: FactSchema[] = [
  ["enemy1", "x", 0],
  ["enemy1", "y", 120],
  ["enemy1", "health", 5],
  ["enemy1", "isEvil", true],
  ["enemy2", "x", -10],
  ["enemy2", "y", 12],
  ["enemy2", "health", 0],
  ["enemy2", "isEvil", true],
]

const villagerFacts: FactSchema[] = [
  ["villager", "x", 30],
  ["villager", "y", 120],
  ["villager", "health", 30],
]

const treeFacts: FactSchema[] = [
  ["tree", "x", 0],
  ["tree", "y", 120],
]

const timeFacts: FactSchema[] = [
  ["time", "dt", 15]
]
const allFacts: FactSchema[] = [
  ...playerFacts,
  ...enemyFacts,
  ...villagerFacts,
  ...treasureFacts,
  ...treeFacts,
  ...timeFacts
]


describe('edict', () => {
  it('complicated happy path is happy', () => {
    const e = edict(ruleSet, allFacts)
    e.fire()


    const results:any = e.query("is_dying")
    console.log("results", results)
    const expectedResults = [
      {$npc: {id: "enemy2", "isDying": true}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });


  // it('Missing fact will result in empty array', () => {
  //   const e = edict(ruleSet, playerFacts)
  //   const results:any = e.fire()
  //   const expectedResults: any = [
  //     // There should be no results because we do not have a ["time", "dt"] fact
  //   ]
  //   expect(results["no_health_is_dying"]).toBe(expectedResults);
  // });
  //
  // it('Inserting facts imperatively works', () => {
  //   const e = edict(ruleSet,)
  //   const facts: FactSchema[] =[
  //     ...playerFacts,
  //     ...timeFacts
  //   ]
  //   facts.forEach(f => e.insert(f))
  //   const results:any = e.fire()
  //   const expectedResults = [
  //     {$npc: {id: "player",health: 100,  x: 10, y: 10}, time: {dt: 16}},
  //   ]
  //   expect(results["no_health_is_dying"]).toBe(expectedResults);
  // });
  //
  // it('Retracting facts works', () => {
  //   const e = edict(ruleSet,)
  //   const facts: FactSchema[] =[
  //     ...playerFacts,
  //     ...enemyFacts,
  //     ...timeFacts
  //   ]
  //   facts.forEach(f => e.insert(f))
  //   enemyFacts.forEach(([id, attr]) => e.retract([id, attr]))
  //   const results:any = e.fire()
  //   const expectedResults = [
  //     {$npc: {id: "player",health: 100,  x: 10, y: 10}, time: {dt: 16}},
  //     // No enemy facts
  //   ]
  //   expect(results["no_health_is_dying"]).toBe(expectedResults);
  // });
});
