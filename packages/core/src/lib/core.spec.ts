import {edict, Rules} from "@edict/core";

export type NpcId = string
export type NpcFactSchema =  [NpcId, "x" | "y" | "health", number] | [NpcId, "isDying", boolean]
export type TimeFactSchema = ["time","dt" | "elapsed", number]
export type  FactSchema = NpcFactSchema | TimeFactSchema
describe('edict', () => {
  it('Match correctly transforms "what" block', () => {

    const facts: FactSchema[] = [
      [ "1", "x",  10],
      [ "1", "y", 10],
      [ "1", "health", 0],
      [ "2", "x",  0],
      [ "2", "y", 120],
      [ "2", "health", 100],
      ["time", "dt", 15]
    ]

    const ruleSet:Rules<FactSchema> = {
      "NPC with 0 health is dying": {
        what: [
          ["$npc", "health"],
        ],
        when: ({$npc}: any) => $npc.health <= 0,
        then: ({$npc }: any, {insert, retract} ) => {
          retract([$npc.id, "health"])
          insert([$npc.id, "isDying", true])
        }
      },
    }

    const e = edict(ruleSet)
    const results = e.match(facts)
    const expectedResults = [
      {$npc: {id: "1", x: 10, y: 10}, time: {dt: 15}},
      {$npc: {id: "2", x: 0, y: 120}, time: {dt: 15}}
    ]
    expect(results).toBe(expectedResults);
  });
});
