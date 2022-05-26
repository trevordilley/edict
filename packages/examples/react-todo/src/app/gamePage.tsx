import {useEdict} from "@edict/react";
import {AttrTypes, rule} from "@edict/core";
import Game from "reactified-phaser/Game";


export function GamePage() {
  const {query, insert} = useEdict(
    {
      factSchema: {
        x: AttrTypes.num(),
        y: AttrTypes.num(),
        size: AttrTypes.num(),
        color: AttrTypes.num(),
        speed: AttrTypes.num(),
        dt: AttrTypes.num(),
        destX: AttrTypes.num(),
        destY: AttrTypes.num()
      },
      rules: ({insert}) => ({
        "moveTowardsMouse": rule({
          what: {
            $npc: {
              x: AttrTypes.num(),
              y: AttrTypes.num(),
              speed: AttrTypes.num()
            },
            time: {
              dt: AttrTypes.num()
            },
            destination: {
              destX: AttrTypes.num(),
              destY: AttrTypes.num()
            }
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
        }),
        "npc": rule({
          what: {
            $npc: {
              x: AttrTypes.num(),
              y: AttrTypes.num(),
              color: AttrTypes.num(),
              size: AttrTypes.num(),
              speed: AttrTypes.num()
            }
          }
        })
      }),
      initialFacts: {
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
      }
    }
  )


  const update = (scene: Phaser.Scene, time: number, deltaTime: number) => {
    scene.game.getFrame()
    insert({
      destination: {destX: scene.input.mousePointer.x, destY: scene.input.mousePointer.y},
      time: {dt: deltaTime}
    })

    const results = query("npc")
    results.forEach(({$npc}) => {
      scene.add.circle($npc.x, $npc.y, $npc.size, $npc.color)
    })
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

  return (
    <Game config={config}/>);
}
