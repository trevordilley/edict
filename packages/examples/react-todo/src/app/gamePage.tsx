import {rule, attr, edict} from "@edict/core";
import Game from "reactified-phaser/Game";

const {insert, addRule, fire} = edict(
  {
    factSchema: {
      x: attr<number>(),
      y: attr<number>(),
      size: attr<number>(),
      color: attr<number>(),
      speed: attr<number>(),
      dt: attr<number>(),
      destX: attr<number>(),
      destY: attr<number>()
    }
  }
)

const queries = {
  moveTowardsMouse: addRule(({x, y, speed, dt, destX, destY}) => rule(
    {
      name: "moveTowardsMouse",
      what: {
        $npc: {x, y, speed},
        time: {dt},
        destination: {destX, destY}
      },
      then: ({destination, $npc, time}) => {
        const pos = new Phaser.Math.Vector2($npc.x, $npc.y)
        const dest = new Phaser.Math.Vector2(destination.destX, destination.destY)
        const dir = dest.subtract(pos).normalize()

        insert({
          [$npc.id]: {
            x: $npc.x + dir.x * $npc.speed * time.dt,
            y: $npc.y + dir.y * $npc.speed * time.dt
          }
        })
      }
    })),
  npc: addRule(({x, y, color, size, speed}) => rule({
    name: "npc",
    what: {
      $npc: {
        x,
        y,
        color,
        size,
        speed
      }
    }
  }))
}

insert({
  player: {
    x: 0,
    y: 0,
    size: 50,
    color: 0x6666ff,
    speed: 1,
  },
  enemy1: {
    x: 100,
    y: 100,
    size: 100,
    color: 0x9966ff,
    speed: 0.2
  },
  enemy2: {
    x: 200,
    y: 200,
    size: 20,
    color: 0xff6699,
    speed: 0.5
  }
})

const update = (scene: Phaser.Scene, time: number, deltaTime: number) => {
  console.log(scene.input.mousePointer.x)
  insert({
    destination: {destX: scene.input.mousePointer.x, destY: scene.input.mousePointer.y},
    time: {dt: deltaTime}
  })

  const results = queries.npc.query()
  results.forEach(({$npc}) => {
    scene.add.circle($npc.x, $npc.y, $npc.size, $npc.color)
  })
  fire()
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {y: 300},
      debug: false
    }
  },
  scene: {
    update: function (time: number, deltaTime: number) {
      update(this as unknown as Phaser.Scene, time, deltaTime)
    }
  }
} as any;

export const GamePage = () => (<Game config={config}/>);


