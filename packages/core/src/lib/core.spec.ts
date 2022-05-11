import {edict, Rules} from "@edict/core";

export type NpcId = string
export type NpcFactSchema =  [NpcId, "x" | "y" | "health" ,number] | [NpcId, "isDying" | "isEvil", boolean]
export type TimeFactSchema = ["time","dt" | "elapsed", number]
export type  FactSchema = NpcFactSchema | TimeFactSchema

const ruleSet:Rules<FactSchema> = {
  "no_health_is_dying": {
    what: [
      ["$npc", "health"],
      ["$npc", "x"],
      ["$npc", "y"],
      ["time", "dt"],
    ],
    when: ({$npc}: any) => $npc.health <= 0,
    then: ({$npc }: any, {insert, retract} ) => {
      retract([$npc.id, "health"])
      insert([$npc.id, "isDying", true])
    }
  },
}

const playerFacts:FactSchema[] =[
    [ "player", "x",  10],
  [ "player", "y", 10],
  [ "player", "health", 100]]

const enemyFacts: FactSchema[] =[
    [ "enemy", "x",  0],
  [ "enemy", "y", 120],
  [ "enemy", "health", 100],
  [ "enemy", "isEvil", true]]

const villagerFacts: FactSchema[] = [
  [ "villager", "x",  30],
  [ "villager", "y", 120],
  [ "villager", "health", 30],
]

const treeFacts: FactSchema[] = [
  [ "tree", "x",  0],
  [ "tree", "y", 120],
]

const timeFacts: FactSchema[] = [
  [ "time", "dt", 15]
]
  const allFacts: FactSchema[] = [
      ...playerFacts,
      ...enemyFacts,
      ...villagerFacts,
    ...treeFacts,
    ...timeFacts
]

describe('edict', () => {
  it('Match correctly transforms "what" block', () => {
    const e = edict(ruleSet, allFacts)
    const results = e.fire()
    const expectedResults = [
      // We should return both the player and enemy records
      {$npc: {id: "enemy",health: 100,  x: 10, y: 10}, time: {dt: 15}},
      {$npc: {id: "villager",health: 30,  x: 30, y: 120}, time: {dt: 15}}
      // But not the "tree" record because it does not have a "health" fact
      // And not the "player" record because it's health is 0
    ]
    expect(results["no_health_is_dying"]).toBe(expectedResults);
  });


  it('Missing fact will result in empty array', () => {
    const e = edict(ruleSet, playerFacts)
    const results = e.fire()
    const expectedResults: any = [
      // There should be no results because we do not have a ["time", "dt"] fact
    ]
    expect(results["no_health_is_dying"]).toBe(expectedResults);
  });

  it('Inserting facts imperatively works', () => {
    const e = edict(ruleSet,)
    const facts: FactSchema[] =[
      ...playerFacts,
      ...timeFacts
    ]
    facts.forEach(f => e.insert(f))
    const results = e.fire()
    const expectedResults = [
      {$npc: {id: "player",health: 100,  x: 10, y: 10}, time: {dt: 16}},
    ]
    expect(results["no_health_is_dying"]).toBe(expectedResults);
  });

  it('Retracting facts works', () => {
    const e = edict(ruleSet,)
    const facts: FactSchema[] =[
      ...playerFacts,
      ...enemyFacts,
      ...timeFacts
    ]
    facts.forEach(f => e.insert(f))
    enemyFacts.forEach(([id, attr]) => e.retract([id, attr]))
    const results = e.fire()
    const expectedResults = [
      {$npc: {id: "player",health: 100,  x: 10, y: 10}, time: {dt: 16}},
      // No enemy facts
    ]
    expect(results["no_health_is_dying"]).toBe(expectedResults);
  });
});
