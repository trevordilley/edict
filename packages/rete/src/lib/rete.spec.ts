import { rete } from './rete';

interface SmallSchema {
  name: string,
  email: string,
  age: number
}

describe('rete', () => {
  it('should work', () => {
    const session = rete.initSession<SmallSchema>()

    /**
     * Here's the data structure for our rules!
     {
      name: "Circles with a destination move to destination",
      what: {
        $npc: {circle, speed, destX, destY},
        time: {dt},
      },
      then: ({ $npc, time}) => {
        const pos = new Phaser.Math.Vector2($npc.circle.x, $npc.circle.y)
        const dest = new Phaser.Math.Vector2($npc.destX, $npc.destY)
        const dir = dest.subtract(pos).normalize()

        $npc.circle.x = $npc.circle.x + dir.x * $npc.speed * time.dt
        $npc.circle.y = $npc.circle.y + dir.y * $npc.speed * time.dt
      }
    }     */

    // matchFn
    // This function literally just maps the string name => enum int value!
    // proc (v_452991817: Vars[Fact]): tuple[y: int, z: int,
    //   a: int, b: int, x: int, h: int] =
    //   (y: v_452991817["y"].slot0,
    //    z: v_452991817["z"].slot0,
    //    a: v_452991817["a"].slot0,
    //    b: v_452991817["b"].slot0,
    //    x: v_452991817["x"].slot0,
    //    h: v_452991817["h"].slot0)

    // condFn
    // let condFn_452991822 = proc (v_452991824: Vars[Fact]): bool =
    //   let a = v_452991824["a"].slot0
    // a != Bob


    // thenFn
    // codegen preassigns the values
    // let b = match.b
    // let y = match.y
    // let z = match.z
    // let a = match.a
    // Then the body is arbitaryily whatever is in the then column, we
    // don't need to worry to much about this cause we actually pass the values into the
    // then function
    // check a == Alice
    // check b == Bob
    // check y == Yair
    // check z == Zach

    rete.initProduction<SmallSchema, any>("test",


  )
    expect(session.thenQueue.size).toBe(0)
  });
});
