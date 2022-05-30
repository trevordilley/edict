import {attr, edict, rule} from "@edict/core";

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


const mkEdict = () => {
  const {addRule, ...rest} = edict({
  factSchema: {
    health: attr<number>(),
    isDying: attr<boolean>(),
    dt: attr<number>(),
    value: attr<number>(),
    x: attr<number>(),
    y: attr<number>(),
    isEvil: attr<boolean>()
  }})

  return {
    ...rest,
    queries: {
      allTreasure: addRule(({value, x, y}) =>
        rule({
          name: "all_treasure",
          what: {
            $treasure: {
              value,
              x,
              y
            }
          }
        })),

      allNpcs: addRule(({health, x, y, dt}) => rule({
        name: "all_npcs",
        what: {
          $npc: {
            health,
            x,
            y,
          },
          time: {
            dt
          }
        }
      })),

      noHealthIsDying: addRule(({health}, {insert, retract}) =>rule({
        name: "no_health_is_dying",
        what: {
          $npc: {
            health,
          }
        },
        when: ({$npc}) => $npc.health <= 0,
        then: ({$npc}) => {
          retract($npc.id, "health")
          insert({[$npc.id]: {isDying: true}})
        }
      })),

      isDying: addRule(({isDying}) =>
        rule({
          name: "is_dying",
          what: {
            $npc: {
              isDying
            }
          },
          when: ({$npc}) => $npc.isDying,
        })),

      complicatedNonsense: addRule(({health, x, y, value, dt}) =>
        rule({
          name: "complicated_nonsense",
          what: {
            $npc: {
              health,
              x,
              y
            },
            $treasure: {
              value,
              x,
              y
            },
            time: {
              dt
            }
          }
        }))
    }
  }
}

describe('edict', () => {
  it('complicated happy path is happy', () => {
    const {insert, fire, queries} = mkEdict()
    insert(allFacts)
    fire()

    const results = queries.isDying.query()
    const expectedResults = [
      {$npc: {id: "enemy2", "isDying": true}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });


  it('Missing fact will result in empty array', () => {
    // None of the players are dying, so if those are the only facts the
    // the is_dying rule should be empty
    const {insert, fire, queries} = mkEdict()
    insert(playerFacts)
    fire()

    const results = queries.isDying.query()
    expect(results).toStrictEqual([]);
  });

  it('Retracting facts works', () => {
    const {queries, retract, insert} = mkEdict()
    const facts = {
      ...playerFacts,
      ...villagerFacts,
      ...timeFacts
    }
    insert(facts)
    const beforeRetract = queries.allNpcs.query()
    const expectedBeforeRetract = [
      {$npc: {id: "player", health: 100, x: 10, y: 10}, time: {id: "time", dt: 15}},
      {$npc: {id: "villager", health: 30, x: 30, y: 120}, time: {id: "time", dt: 15}},
    ]
    expect(beforeRetract).toStrictEqual(expectedBeforeRetract);
    retract("villager", "x", "y", "health" )
    const results = queries.allNpcs.query()
    const expectedResults = [
      {$npc: {id: "player", health: 100, x: 10, y: 10}, time: {id: "time", dt: 15}},
      // No villager facts
    ]
    expect(results).toStrictEqual(expectedResults);
  });
});
