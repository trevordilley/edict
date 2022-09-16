import {rule, attr, edict} from "@edict/core";
import * as Phaser from "phaser";
import {useLayoutEffect} from "react";
const {insert, retract, addRule, fire } = edict(
  {
    factSchema: {
      speed: attr<number>(),
      dt: attr<number>(),
      destX: attr<number>(),
      destY: attr<number>(),
      circle: attr<Phaser.GameObjects.Arc>()
    }
  }
)

const queries = {

  debug: addRule(({ speed, dt}) => rule(
    {
      name: "debug",
      what: {
        $npc: { speed },
        time: {dt},
      },
      then: (args) => {
        console.log(args)
      }
    })),

  moveTowardsMouse: addRule(({circle, speed, dt, destX, destY}) => rule(
    {
      name: "Circles with a destination move to destination",
      what: {
        $npc: {circle, speed, destX, destY},
        time: {dt},
      },
      // IDEA: What if we decorate names such that we imply behavriours?
      // (to accomadate thee `then: false` thing in o'doyle?
      // if we wanted `destX` and `destY` to have the `then: false` thing
      // maybe we do the following??
      //
      // Following this line of thought, we also like to trigger on the absence of
      // data, which the 1995 paper mentions is possible. Perhaps another decorator?
      // String literal types would allow this to work!
      // what: {
      //   $npc: {circle, speed, destX$once, destY, health$not},
      //   time: {dt},
      // },
      then: ({ $npc, time}) => {
        const pos = new Phaser.Math.Vector2($npc.circle.x, $npc.circle.y)
        const dest = new Phaser.Math.Vector2($npc.destX, $npc.destY)
        const dir = dest.subtract(pos).normalize()

        $npc.circle.x = $npc.circle.x + dir.x * $npc.speed * time.dt
        $npc.circle.y = $npc.circle.y + dir.y * $npc.speed * time.dt
      }
    })),

  // setNewDestination: addRule(({circle, destX, destY}) => rule(
  //   {
  //     name: "When a new destination is set, add the destination to the circles",
  //     what: {
  //       $npc: {circle},
  //       newDestination: {destX, destY}
  //     },
  //     then: ({newDestination, $npc}) => {
  //       insert({[$npc.id]: {destX: newDestination.destX, destY: newDestination.destY}})
  //     },
  //     thenFinally: () => {
  //       retract("newDestination", "destX", "destY")
  //     }
  //   })),
  //
  // arriveAtDestinationThenStop: addRule(({ circle, destX, destY}) => rule({
  //   name: "Arriving at their destination stops them",
  //   what: {
  //     $npc: {destX, destY, circle}
  //   },
  //   then: ({$npc}) => {
  //     const pos = new Phaser.Math.Vector2($npc.circle.x, $npc.circle.y)
  //     const dest = new Phaser.Math.Vector2($npc.destX, $npc.destY)
  //     const distance = dest.distance(pos)
  //     if(distance < 10) {
  //       retract($npc.id, "destX", "destY")
  //     }
  //   }
  // }))
}

const create = (scene: Phaser.Scene) => {
  scene.input.on("pointerdown", (pointer: MouseEvent) => {
    const {x, y} = pointer
    console.log("clicking?", x, y)
    insert({newDestination: {destX: x, destY: y}})
  })
  //
  // const playerCircle = scene.add.circle(0, 0, 50, 0x6666ff)
  // const enemy1Circle = scene.add.circle(100, 100, 100, 0x9966ff)
  // const enemy2Circle = scene.add.circle(200, 200, 20, 0xff6699)
  insert({
    player: {
      speed: 1,
    },
    enemy1: {
      speed: 0.2,
    },
    enemy2: {
      speed: 0.5,
    }
  })
}

const update = (scene: Phaser.Scene, time: number, deltaTime: number) => {
  const b = performance.now()
  insert({
    time: {dt: deltaTime},
    player: {
      speed: deltaTime
    },
    enemy1: {
      speed: deltaTime
    },
    enemy2: {
      speed: deltaTime
    },
    enemy3: {
      speed: deltaTime
    },
    enemy4: {
      speed: deltaTime
    },
    enemy5: {
      speed: deltaTime
    },

    enemy6: {
      speed: deltaTime
    },
    enemy7: {
      speed: deltaTime
    },
    enemy8: {
      speed: deltaTime
    },
    enemy9: {
      speed: deltaTime
    },
    enemy10: {
      speed: deltaTime
    },
    enemy11: {
      speed: deltaTime
    },
    enemy12: {
      speed: deltaTime
    },
    enemy13: {
      speed: deltaTime
    },
    enemy14: {
      speed: deltaTime
    },
    enemy15: {
      speed: deltaTime
    },
    enemy16: {
      speed: deltaTime
    },
    enemy17: {
      speed: deltaTime
    },
    enemy18: {
      speed: deltaTime
    },
    enemy19: {
      speed: deltaTime
    },
    enemy20: {
      speed: deltaTime
    },
    enemy21: {
      speed: deltaTime
    },
    enemy22: {
      speed: deltaTime
    },
  })
  fire()
  const a = performance.now()
  console.log(a - b, "ms")

  const results = queries.debug.query()
  results.forEach(r =>
    console.log(r.$npc.id, " -- speed: ", r.$npc.speed, ", dt ", r.time.dt)
  )
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game",
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {y: 300},
      debug: false
    }
  },
  scene: {
    create: function () {
      create(this as unknown as Phaser.Scene)
    },
    update: function (time: number, deltaTime: number) {
      update(this as unknown as Phaser.Scene, time, deltaTime)
    }
  }
} as any;


export const GamePage = () => {

  useLayoutEffect(() => {
    const game = new Phaser.Game(config)
    return () => {
      game.destroy(true)
    }
  },[])

  return (<span id={"game"}/>);
}


