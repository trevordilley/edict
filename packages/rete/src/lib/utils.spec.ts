import {Dictionary, Set as TsSet} from "typescript-collections";
import {Field, rete} from "@edict/rete";

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

});
