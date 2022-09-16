import {Dictionary, Set as TsSet} from "typescript-collections";
import {Field, rete} from "@edict/rete";
import objectHash from "object-hash";
import {sum} from "./hash";

describe('Utilities', () => {

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

  it("Maps use string keys as values", () => {

    const str1 = "blik"
    const str2 = "blik"

    const m = new Map()
    m.set(str1, 3)
    const result = m.get(str2)
    expect(result).toBe(3)

  })

  it("Map has copy constructor", () => {
    const map1 = new Map<string, string>()
    map1.set("key", "foo")

    const map2 = new Map(map1)
    const result = map2.get("key")
    expect(result).toBe("foo")
  })


  it("Sets are performant", () => {
    const arr = [1, "2", 3]
    const arr2 = [1, "2", 3]

    const collSet = new TsSet((k) => sum(k))
    const before = performance.now()
    collSet.add(arr)
    const after = performance.now()
    const diff = after - before

    expect(collSet.contains(arr2)).toBe(true)
    console.log(diff)
    expect(diff).toBeLessThanOrEqual(1)

  })

});
