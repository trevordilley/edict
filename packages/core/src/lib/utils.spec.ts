import {edict, Rules, WHAT_SCHEMA} from "@edict/core";
import {groupRuleById} from "./utils";

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

describe('utils', () => {
  it('can group what by id', () => {
    const e = groupRuleById(ruleSet["no_health_is_dying"].what)

    console.log(e)
    const expected = {
      "$npc": ["health", "x", "y"],
      "time": ["dt"]
    }
    expect(e).toStrictEqual(expected)
  });
});
