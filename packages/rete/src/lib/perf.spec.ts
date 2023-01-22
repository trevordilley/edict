import {
  leftActCountAfter,
  leftActCountBefore,
  matchVarCount,
  msDoActivate,
  nonEmptyVarUpdates,
  numTokens,
  rete,
  varKeys,
} from './rete'
import { Field, MatchedVars, vizOnlineUrl } from '@edict/rete'
import { performance } from 'perf_hooks'
import v8Profiler from 'v8-profiler-next'
import * as fs from 'fs'
import { hashIdAttr } from './utils'

v8Profiler.setGenerateType(1)

const perfResults = () => {
  const measureMap = new Map<
    string,
    { total: number; count: number; avg: number }
  >()
  performance.getEntriesByType('measure').map((p) => {
    if (!measureMap.has(p.name)) {
      measureMap.set(p.name, { total: 0, count: 0, avg: 0 })
    }
    measureMap.get(p.name)!.count += 1
    measureMap.get(p.name)!.total += p.duration
  })
  const results: any = {}
  measureMap.forEach((agg, name) => {
    measureMap.get(name)!.avg = agg.total / agg.count
    results[name] = measureMap.get(name)
  })
  return results
}

const profile = <T>(
  name: string,
  outdir: string,
  fn: () => T,
  dontrun = false
) => {
  v8Profiler.startProfiling(name, true)
  const result = fn()
  const profile = v8Profiler.stopProfiling(name)
  profile.export(function (error, result: any) {
    // if it doesn't have the extension .cpuprofile then
    // chrome's profiler tool won't like it.
    // examine the profile:
    //   Navigate to chrome://inspect
    //   Click Open dedicated DevTools for Node
    //   Select the profiler tab
    //   Load your file
    fs.mkdirSync(outdir, { recursive: true })
    fs.writeFileSync(`${outdir.replace(/\/$/, '')}/${name}.cpuprofile`, result)
    profile.delete()
  })
  return result
}

const bench = (name: string, fn: () => void) => {
  let cycle_n = 1
  let cycle_ms = 0
  let cycle_total_ms = 0

  const bench_iter = (fn: () => void, count: number) => {
    const start = performance.now()
    for (let i = 0; i < count; i++) {
      fn()
    }
    const end = performance.now()
    return end - start
  }

  // Run multiple cycles to get an estimate
  while (cycle_total_ms < 500) {
    const elapsed = bench_iter(fn, cycle_n)
    cycle_ms = elapsed / cycle_n
    cycle_n *= 2
    cycle_total_ms += elapsed
  }

  // Try to estimate the iteration count for 500ms
  const target_n = 500 / cycle_ms
  const total_ms = bench_iter(fn, target_n)

  return {
    hz: (target_n / total_ms) * 1_000, // ops/sec
    ms: total_ms / target_n, // ms/op
  }
}

interface Schema {
  A: number
  B: number
  C: number
  D: number
  E: number
  F: number
  G: number
  H: number
  I: number
  J: number
  K: number
  L: number
  M: number
  N: number
  O: number
  P: number
  Q: number
  R: number
  S: number
  T: number
  U: number
  V: number
  W: number
  X: number
  Y: number
  Z: number
  Data: number
  delta: number
}

const convertMatchFn = (vars: MatchedVars<Schema>) => vars

// Tests based on these benchmarks: https://github.com/noctjs/ecs-benchmark

it('compare new Map vs ...', () => {
  const m = new Map([
    ['$someVar', 'someValue'],
    ['$someOtherVar', 'someValue'],
  ])
  const a = [
    // node id condition id hash
    (45 << 16) + 22,
    // idAttr hash
    (2340 << 16) + 10,
    // value idx
    12334,
    // idAttr hash
    (2344 << 16) + 8,
    // value idx
    4321,
  ]
  const numItrs = 50_000

  const bm = performance.now()
  for (let i = 0; i < numItrs; i++) {
    const n = new Map(m)
    n.set('$anotherAnotherKey', 'someOtherValue')
  }
  const am = performance.now()

  const ba = performance.now()
  for (let i = 0; i < numItrs; i++) {
    const n = [...a, (9999 << 16) + 5, 98475]
    n[0] = 1
  }
  const aa = performance.now()

  const bc = performance.now()
  for (let i = 0; i < numItrs; i++) {
    a[5] = (9999 << 16) + i
    a[6] = i
  }
  const ac = performance.now()

  console.log('map', am - bm, 'array', aa - ba, 'element update', ac - bc)

  // Array copy is 4x faster than new map. Updating an array is 10x faster than then new amp
  expect(2).toBe(2)
})

it('extract id and attr from hash', () => {
  // Max values are 2^15 apiece
  const id = 32767
  const attr = 32767

  const hash = (attr << 16) + id

  // Unshift 16 bits to the second half
  const attr2 = hash >> 16
  // Shift overtop second half, then shift back to get first 16 bits
  const id2 = (hash << 16) >> 16

  expect(id2).toBe(id)
  expect(attr2).toBe(attr)
})

it('compare charAt hash with bitshift hash', () => {
  const ids = []
  const attrs = []
  for (let i = 0; i < 1000; i++) {
    ids[i] = i
  }
  for (let i = 0; i < 10; i++) {
    attrs[i] = i
  }

  const idAttrStr: string[][] = []
  const idAttrInt: number[][] = []
  for (let i = 0; i < ids.length * attrs.length; i++) {
    const [id, attr] = [ids[i % ids.length], attrs[i % attrs.length]]
    idAttrStr[i] = [`${id}xxx-aaaa-bbbb-cccc-aaaaa`, `${attr}SomeAttr`]
    idAttrInt[i] = [id, attr]
  }
  const iterations = 5000
  const hashMap = new Map<number, number>()

  const bStr = performance.now()
  for (let i = 0; i < iterations; i++) {
    for (let j = 0; j < idAttrStr.length; j++) {
      const idAttr = idAttrStr[j]
      if (idAttr === undefined) {
        console.log(j)
      }
      hashMap.set(hashIdAttr(idAttr), i * j)
    }
  }
  const aStr = performance.now()
  const bBit = performance.now()
  for (let i = 0; i < iterations; i++) {
    for (let j = 0; j < idAttrInt.length; j++) {
      const idx = idAttrInt[j][0] << (16 + idAttrInt[j][1])
      hashMap.set(idx, i * j)
    }
  }
  const aBit = performance.now()

  console.log('hash', aStr - bStr, 'bit', aBit - bBit)

  expect(2).toBe(2)
})

it('test map instantiation', () => {
  const orig = new Map()
  orig.set('Delta', 1)
  orig.set('dt', 1)
  const orig2 = new Map()
  orig.set('Delta', 1)
  orig.set('dt', 1)

  const mut3 = new Map()

  let n = orig
  const b = performance.now()
  for (let i = 0; i < 540_000; i++) {
    n = new Map(orig)
  }
  const a = performance.now()
  const b2 = performance.now()
  for (let i = 0; i < 540_000; i++) {
    mut3.set(i % 1000, i)
  }
  const a2 = performance.now()
  const b3 = performance.now()
  let y
  for (let i = 0; i < 540_000; i++) {
    y = () => i
  }
  const a3 = performance.now()
  console.log('inst', a - b)
  console.log('mut', a2 - b2)
  console.log('fn', a3 - b3)
  expect(2).toBe(2)
})

describe('rete perf', () => {
  it('packed_5', () => {
    // @ts-ignore
    const session = rete.initSession<Schema>(false, { enabled: true })
    const makeProduction = (name: keyof Schema) => {
      const valName = name.toLowerCase()
      const entJoin = '$ent'
      const production = rete.initProduction<Schema, MatchedVars<Schema>>({
        name: `${name} production`,
        convertMatchFn,
        thenFn: ({ vars }) => {
          const id = vars.get(entJoin)!
          const val = vars.get(valName) as number
          rete.insertFact(session, [id, name, val * 2])
        },
      })
      rete.addConditionsToProduction(
        production,
        { name: 'Delta', field: Field.IDENTIFIER },
        'delta',
        { name: 'dt', field: Field.VALUE },
        true
      )
      rete.addConditionsToProduction(
        production,
        { name: entJoin, field: Field.IDENTIFIER },
        name,
        { name: valName, field: Field.VALUE },
        false
      )
      rete.addProductionToSession(session, production)
      return production
    }
    const a = makeProduction('A')
    const b = makeProduction('B')
    makeProduction('C')
    makeProduction('D')
    makeProduction('E')
    console.log(vizOnlineUrl(session))

    rete.insertFact(session, ['Delta', 'delta', 1])
    const NUM_ENTITIES = 4
    for (let i = 0; i < NUM_ENTITIES; i++) {
      rete.insertFact(session, [i, 'A', 1])
      rete.insertFact(session, [i, 'B', 1])
      rete.insertFact(session, [i, 'C', 1])
      rete.insertFact(session, [i, 'D', 1])
      rete.insertFact(session, [i, 'E', 1])
    }
    rete.fireRules(session)
    rete.insertFact(session, ['Delta', 'delta', 1])
    rete.fireRules(session)
    rete.insertFact(session, ['Delta', 'delta', 1])
    const x = rete.queryAll(session, a)
    const y = rete.queryAll(session, b)
    const before = performance.now()
    let count = 0
    // const { hz } = bench('packed5', () => {
    //   const dt = Math.random()
    //   rete.insertFact(session, ['Delta', 'delta', dt])
    //   rete.fireRules(session)
    //   count++
    // })
    const after = performance.now()
    const measureMap = new Map<
      string,
      { total: number; count: number; avg: number }
    >()
    performance.getEntriesByType('measure').map((p) => {
      if (!measureMap.has(p.name)) {
        measureMap.set(p.name, { total: 0, count: 0, avg: 0 })
      }
      measureMap.get(p.name)!.count += 1
      measureMap.get(p.name)!.total += p.duration
    })
    const results: any = {}
    measureMap.forEach((agg, name) => {
      measureMap.get(name)!.avg = agg.total / agg.count
      results[name] = measureMap.get(name)
    })
    console.log(
      'nonEmptyVarSets ',
      nonEmptyVarUpdates,
      ' num tokens',
      numTokens,
      'before ',
      leftActCountBefore,
      ' after ',
      leftActCountAfter,
      ' total ',
      leftActCountAfter + leftActCountBefore,
      ' ms do activate ',
      msDoActivate,
      ' ms total ',
      after - before,
      ' count ',
      count,
      ' match var count ',
      matchVarCount
    )
    console.log('keys ', varKeys)
    expect(2).toBe(2)
    // expect(hz).toBeGreaterThan(1)
    // expect(hz).toBeGreaterThan(10)
    // expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
    // expect(hz).toBeGreaterThan(300_000)
  })

  it('simple_iter', () => {
    const session = rete.initSession<Schema>(false)
    const makeProduction = (first: keyof Schema, second: keyof Schema) => {
      const firstValName = first.toLowerCase()
      const secondValName = second.toLowerCase()
      const firstJoin = '$first'
      const secondJoin = '$second'
      const production = rete.initProduction<Schema, MatchedVars<Schema>>({
        name: `${first}-${second}`,
        convertMatchFn,
        thenFn: ({ vars }) => {
          const firstId = vars.get(firstJoin)!
          const secondId = vars.get(secondJoin)!
          const firstVal = vars.get(firstValName) as number
          const secondVal = vars.get(secondValName) as number
          rete.insertFact(session, [firstId, second, firstVal])
          rete.insertFact(session, [secondId, first, secondVal])
        },
      })
      rete.addConditionsToProduction(
        production,
        { name: 'Delta', field: Field.IDENTIFIER },
        'delta',
        { name: 'dt', field: Field.VALUE },
        true
      )
      rete.addConditionsToProduction(
        production,
        { name: firstJoin, field: Field.IDENTIFIER },
        first,
        { name: firstValName, field: Field.VALUE },
        false
      )
      rete.addConditionsToProduction(
        production,
        { name: secondJoin, field: Field.IDENTIFIER },
        second,
        { name: secondValName, field: Field.VALUE },
        false
      )
      rete.addProductionToSession(session, production)
    }
    makeProduction('A', 'B')
    makeProduction('C', 'D')
    makeProduction('C', 'E')

    rete.insertFact(session, ['Delta', 'delta', 1])
    const NUM_ENTITIES = 1
    for (let i = 0; i < NUM_ENTITIES; i++) {
      const ab = `${i}ab`
      rete.insertFact(session, [ab, 'A', 0])
      rete.insertFact(session, [ab, 'B', 1])
      const abc = `${i}abc`
      rete.insertFact(session, [abc, 'A', 0])
      rete.insertFact(session, [abc, 'B', 1])
      rete.insertFact(session, [abc, 'C', 2])
      const abcd = `${i}abcd`
      rete.insertFact(session, [abcd, 'A', 0])
      rete.insertFact(session, [abcd, 'B', 1])
      rete.insertFact(session, [abcd, 'C', 2])
      rete.insertFact(session, [abcd, 'D', 3])
      const abce = `${i}abce`
      rete.insertFact(session, [abce, 'A', 0])
      rete.insertFact(session, [abce, 'B', 1])
      rete.insertFact(session, [abce, 'C', 2])
      rete.insertFact(session, [abce, 'E', 3])
    }
    rete.fireRules(session)

    const { hz } = bench('simple_iter', () => {
      rete.insertFact(session, ['Delta', 'delta', 1])
      rete.fireRules(session)
    })
    expect(hz).toBeGreaterThan(0)
    expect(hz).toBeGreaterThan(1)
    expect(hz).toBeGreaterThan(10)
    // expect(NUM_ENTITIES).toBeGreaterThan(99)
    // expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
  })

  it('frag_iter', () => {
    const session = rete.initSession<Schema>(false)
    const makeProduction = (name: keyof Schema) => {
      const valName = name.toLowerCase()
      const joinId = '$ent'
      const production = rete.initProduction<Schema, MatchedVars<Schema>>({
        name,
        convertMatchFn,
        thenFn: ({ vars }) => {
          const id = vars.get(joinId)!
          const val = vars.get(valName) as number
          rete.insertFact(session, [id, name, val * 2])
        },
      })
      rete.addConditionsToProduction(
        production,
        { name: 'Delta', field: Field.IDENTIFIER },
        'delta',
        { name: 'dt', field: Field.VALUE },
        true
      )
      rete.addConditionsToProduction(
        production,
        { name: joinId, field: Field.IDENTIFIER },
        name,
        { name: valName, field: Field.VALUE },
        false
      )
      rete.addProductionToSession(session, production)
    }
    makeProduction('Z')
    makeProduction('Data')

    rete.insertFact(session, ['Delta', 'delta', 1])
    const NUM_ENTITIES = 100
    const COMPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') as (keyof Schema)[]
    for (let i = 0; i < NUM_ENTITIES; i++) {
      for (const comp of COMPS) {
        rete.insertFact(session, [`${i}${comp}`, comp, 1])
        rete.insertFact(session, [`${i}${comp}`, 'Data', 1])
      }
    }
    rete.fireRules(session)

    const { hz } = bench('frag_iter', () => {
      rete.insertFact(session, ['Delta', 'delta', 1])
      rete.fireRules(session)
    })
    expect(hz).toBeGreaterThan(1)
    expect(hz).toBeGreaterThan(10)
    // expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
    // expect(hz).toBeGreaterThan(300_000)
    // expect(hz).toBeGreaterThan(500_000)
  })

  it('entity_cycle', () => {
    const session = rete.initSession<Schema>(false)
    const joinId = '$ent'
    const spawnB = rete.initProduction<Schema, MatchedVars<Schema>>({
      name: 'Spawn B',
      convertMatchFn,
      thenFn: ({ vars }) => {
        const id = vars.get(joinId)!
        const val = vars.get('a') as number
        rete.insertFact(session, [`${id}B`, 'B', val * 2])
      },
    })
    rete.addConditionsToProduction(
      spawnB,
      { name: 'Delta', field: Field.IDENTIFIER },
      'delta',
      { name: 'dt', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      spawnB,
      { name: joinId, field: Field.IDENTIFIER },
      'A',
      { name: 'a', field: Field.VALUE },
      false
    )
    rete.addProductionToSession(session, spawnB)
    const retractB = rete.initProduction<Schema, MatchedVars<Schema>>({
      name: 'Retract B',
      convertMatchFn,
      thenFn: ({ vars }) => {
        const id = vars.get(joinId) as string
        rete.retractFactByIdAndAttr(session, id, 'B')
      },
    })
    rete.addConditionsToProduction(
      spawnB,
      { name: 'Delta', field: Field.IDENTIFIER },
      'delta',
      { name: 'dt', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      spawnB,
      { name: joinId, field: Field.IDENTIFIER },
      'B',
      { name: 'b', field: Field.VALUE },
      false
    )
    rete.addProductionToSession(session, retractB)

    rete.insertFact(session, ['Delta', 'delta', 1])
    const NUM_ENTITIES = 1000
    for (let i = 0; i < NUM_ENTITIES; i++) {
      rete.insertFact(session, [i, 'A', 1])
    }
    rete.fireRules(session)

    const { hz } = bench('entity_cycle', () => {
      rete.insertFact(session, ['Delta', 'delta', 1])
      rete.fireRules(session)
    })
    expect(hz).toBeGreaterThan(1)
    expect(hz).toBeGreaterThan(10)
    // expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
    // expect(hz).toBeGreaterThan(300_000)
    // expect(hz).toBeGreaterThan(500_000)
  })

  it('add_remove', () => {
    const session = rete.initSession<Schema>(false)
    const joinId = '$ent'
    const spawnB = rete.initProduction<Schema, MatchedVars<Schema>>({
      name: 'Spawn B',
      convertMatchFn,
      thenFn: ({ vars }) => {
        const id = vars.get(joinId)!
        const val = vars.get('a') as number
        rete.insertFact(session, [id, 'B', val * 2])
      },
    })
    rete.addConditionsToProduction(
      spawnB,
      { name: 'Delta', field: Field.IDENTIFIER },
      'delta',
      { name: 'dt', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      spawnB,
      { name: joinId, field: Field.IDENTIFIER },
      'A',
      { name: 'a', field: Field.VALUE },
      false
    )
    rete.addProductionToSession(session, spawnB)
    const retractB = rete.initProduction<Schema, MatchedVars<Schema>>({
      name: 'Retract B',
      convertMatchFn,
      thenFn: ({ vars }) => {
        const id = vars.get(joinId) as string
        rete.retractFactByIdAndAttr(session, id, 'B')
      },
    })
    rete.addConditionsToProduction(
      spawnB,
      { name: 'Delta', field: Field.IDENTIFIER },
      'delta',
      { name: 'dt', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      spawnB,
      { name: joinId, field: Field.IDENTIFIER },
      'B',
      { name: 'b', field: Field.VALUE },
      false
    )
    rete.addProductionToSession(session, retractB)

    rete.insertFact(session, ['Delta', 'delta', 1])
    const NUM_ENTITIES = 1000
    for (let i = 0; i < NUM_ENTITIES; i++) {
      rete.insertFact(session, [i, 'A', 1])
    }
    rete.fireRules(session)

    const { hz } = bench('add_remove', () => {
      rete.insertFact(session, ['Delta', 'delta', 1])
      rete.fireRules(session)
    })
    expect(hz).toBeGreaterThan(1)
    expect(hz).toBeGreaterThan(10)
    // expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
    // expect(hz).toBeGreaterThan(300_000)
    // expect(hz).toBeGreaterThan(500_000)
  })
})
