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
  const {newRule, ...rest} = edict({
  factSchema: {
    dt: attr<number>(),
    health: attr<number>(),
    // isDying: attr<boolean>(),
    // value: attr<number>(),
    // x: attr<number>(),
    // y: attr<number>(),
    // isEvil: attr<boolean>()
  }})

  return {
    ...rest,
    queries: {
      time: newRule("time", ({dt, health}) =>
          ({
            time: {
              dt
            },
            $npc: {
              health
            }
        })).enact({
        then:(args => args.$npc.)
      }).query(),
  //     allTreasure: addRule(({value, x, y}) =>
  //       rule({
  //         name: "all_treasure",
  //         what: {
  //           $treasure: {
  //             value,
  //             x,
  //             y
  //           }
  //         }
  //       })),
  //
  //     allNpcs: addRule(({health, x, y}) => rule({
  //       name: "all_npcs",
  //       what: {
  //         $npc: {
  //           health,
  //           x,
  //           y,
  //         }
  //       }
  //     })),
  //
  //     allNpcsWithTimeDt: addRule(({health, x, y, dt}) =>
  //       rule({
  //       name: "all_npcs_with_dt",
  //       what: {
  //         $npc: {
  //           health,
  //           x,
  //           y,
  //         },
  //         time: {
  //           dt
  //         }
  //       }
  //     })),
  //
  //     noHealthIsDying: addRule(({ health, dt}, {insert, retract}) =>rule({
  //       name: "no_health_is_dying",
  //       what: {
  //         $npc: {
  //           health,
  //         },
  //       },
  //       when: ({$npc}) => $npc.health <= 0,
  //       then: ({$npc}) => {
  //         retract($npc.id, "health")
  //         insert({[$npc.id]: {isDying: true}})
  //       }
  //     })),
  //
  //     isDying: addRule(({isDying}) =>
  //       rule({
  //         name: "is_dying",
  //         what: {
  //           $npc: {
  //             isDying
  //           }
  //         },
  //         when: ({$npc}) => $npc.isDying,
  //       })),
  //
  //     complicatedNonsense: addRule(({health, x, y, value, dt}) =>
  //       rule({
  //         name: "complicated_nonsense",
  //         what: {
  //           $npc: {
  //             health,
  //             x,
  //             y
  //           },
  //           $treasure: {
  //             value,
  //             x,
  //             y
  //           },
  //           time: {
  //             dt
  //           }
  //         }
  //       }))
     }
   }
}

describe('edict', () => {
  it('simple unbound query works', () => {
    const {insert, fire, queries} = mkEdict()

    insert(timeFacts)
    fire()

    const results = queries.time.query()
    const expectedResults = [
      {time: {id: "time", ...timeFacts.time}},
    ]
    expect(results).toStrictEqual(expectedResults);
  });
});
