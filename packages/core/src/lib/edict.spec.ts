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
  const {newRule, insert, retract, ...rest} = edict({
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
    insert,
    retract,
    ...rest,
    queries: {
      time: newRule("time", ({dt}) =>
          ({
            time: {
              dt
            }
        })).enact(),
      allTreasure: newRule("all_treasure", ({value, x, y}) =>
        ({
            $treasure: {
              value,
              x,
              y
           }
        })).enact(),

      allNpcs: newRule("all_npcs", ({health, x, y}) => ({
          $npc: {
            health,
            x,
            y,
          }

      })).enact(),

      allNpcsWithTimeDt: newRule("all_npcs_with_time_dt", ({health, x, y, dt}) =>
        ({
          $npc: {
            health,
            x,
            y,
          },
          time: {
            dt
          }
      })).enact(),

      noHealthIsDying: newRule("no_health_is_dying", ({ health, dt}) =>({
          $npc: {
            health,
          },
        })).enact({
        when: ({$npc}) => $npc.health <= 0,
        then: ({$npc}) => {
          retract($npc.id, "health")
          insert({[$npc.id]: {isDying: true}})
        }
      }),

      isDying: newRule("id_dying", ({isDying}) =>
          ({
            $npc: {
              isDying
            }}))
        .enact({
          when: ({$npc}) => $npc.isDying,
        }),

      complicatedNonsense: newRule("complicated_nonsense", ({health, x, y, value, dt}) =>
        ({
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
        )).enact()
    }
  }
}

describe('edict', () => {
  it('2 simple unbound query works', () => {
    const {insert, fire, queries} = mkEdict()

    insert(timeFacts)
    fire()

    const results = queries.time.query()
    const expectedResults = [
      {time: {id: "time", ...timeFacts.time}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });
  it('2 simple bound query works', () => {
    const {insert, fire, queries} = mkEdict()

    insert(villagerFacts)
    fire()

    const results = queries.allNpcs.query()
    const expectedResults = [
      {$npc: {id: "villager", ...villagerFacts.villager}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });
  it('2 complicated happy path is happy', () => {
    const {insert, fire, queries} = mkEdict()

    insert(allFacts)
    fire()


    const results = queries.isDying.query()
    const expectedResults = [
      {$npc: {id: "enemy2", "isDying": true}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });

  it("Performs quickly with repeated updates", () => {

    const {insert, fire, queries} = mkEdict()
    // Initial insert
    insert(playerFacts)
    fire()

    let numSlow = 0
    for(let i =0; i < 10000; i++) {
      const timeUpdate = {
        player: { x: i},
      }

      const before = performance.now()
      insert(timeUpdate)
      fire()
      const after = performance.now()
      const diff = after-before
      if(after - before > 1)  {
        numSlow++
      }
    }
    expect(numSlow).toBeLessThanOrEqual(100)
  })

  it('2 Missing fact will result in empty array', () => {
    // None of the players are dying, so if those are the only facts the
    // the is_dying rule should be empty
    const {insert, fire, queries} = mkEdict()
    insert(playerFacts)
    fire()



    const results = queries.isDying.query()
    expect(results).toStrictEqual([]);
  });

  it('2 Retracting facts works', () => {
    const {queries, retract, insert, fire} = mkEdict()
    const facts = {
      ...playerFacts,
      ...villagerFacts,
      ...timeFacts
    }
    insert(facts)
    fire()
    const beforeRetract = queries.allNpcsWithTimeDt.query()
    const expectedBeforeRetract = [
      {$npc: {id: "player", health: 100, x: 10, y: 10}, time: {id: "time", dt: 15}},
      {$npc: {id: "villager", health: 30, x: 30, y: 120}, time: {id: "time", dt: 15}},
    ]
    expect(beforeRetract).toStrictEqual(expectedBeforeRetract);
    retract("villager", "x", "y", "health" )
    fire()
    const results = queries.allNpcsWithTimeDt.query()
    const expectedResults = [
      {$npc: {id: "player", health: 100, x: 10, y: 10}, time: {id: "time", dt: 15}},
      // No villager facts
    ]
    expect(results).toStrictEqual(expectedResults);
  });
});
