import {rete} from './rete';
import {Field} from "@edict/rete";
import {Dictionary, Set as TsSet} from "typescript-collections";

interface SmallSchema {
  name: string,
  email: string,
  age: number
}

describe('rete', () => {

  it("Sets set values correctly", () => {
    const x = {
      testField: 1,
      testValue: 'name',
      successors: [],
      children: [
      {
        testField: 2,
        testValue: 'Bob Johnson',
        successors: [],
        children: [],
        facts: new Dictionary()
      }
    ]
    }

    const y = {
      testField: 2,
      testValue: 'Bob Johnson',
      successors: [
        {
          parent: undefined,
          alphaNode: undefined,
          condition: {},
          ruleName: 'test',
          oldIdAttrs: new Set(),
          child: []
        }
      ],
      children: [],
    }

    const s = new Set()
    s.add(x)
    s.add(y)
    expect(s.size).toBe(2)


  })
  it("Sets are value based", () => {
    const arr = [1, "2", 3]
    const arr2 = [1, "2", 3]
    const nativeSet = new Set()
    nativeSet.add(arr)
    expect(nativeSet.has(arr2)).toBe(false)

    const collSet = new TsSet()
    collSet.add(arr)
    expect(collSet.contains(arr2)).toBe(true)
  })
  it("dictionary keys are value based", () => {
    const key1 = ["a", "b"]
    const key2 = ["a", "b"]
    const d = new Dictionary()
    const val = 100
    d.setValue(key1, val)
    const result = d.getValue(key2)

    expect(result).toBe(val)

    const m = new Map()
    m.set(key1, val)
    const mResult = m.get(key2)

    expect(mResult).toBe(undefined)
  })

  it('should work', () => {
    const session = rete.initSession<SmallSchema>(false)

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

    const production = rete.initProduction<SmallSchema>("test",
      (vars) => {
      return vars as any},
      (vars) => {
        return true
      },
      (vars) => {
      return vars as any
      } )

    rete.addConditionsToProduction(production, {name: "id", field: Field.IDENTIFIER}, "name", {name: "val", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "id2", field: Field.IDENTIFIER}, "name", {name: "val2", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session, ["Bob", "name", "Bob Johnson"])
    rete.insertFact(session, ["Jane", "name", "Jane Wilmore"])
    rete.insertFact(session, ["Janes Email", "email", "jane.wilmore@gmail.com"])

    expect(session.thenQueue.size()).toBe(4)
    rete.fireRules(session)
    expect(session.thenQueue.size()).toBe(0)
  });
});
