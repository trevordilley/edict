import { rete } from './rete'
import { Field, MatchT, viz } from '@edict/rete'
import { performance } from 'perf_hooks'
import v8Profiler from 'v8-profiler-next'
import * as fs from 'fs'
import MurmurHash3 from 'imurmurhash'

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

const profile = <T>(name: string, outdir: string, fn: () => T) => {
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
  return profile(name, 'profiles/packages/rete', () => {
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
  })
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

const convertMatchFn = (vars: MatchT<Schema>) => vars

// Tests based on these benchmarks: https://github.com/noctjs/ecs-benchmark

describe('baseline measure of time', () => {
  const sleep = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  it('takes 200 milliseconds', async () => {
    performance.now()
    await sleep(1)
    const start = performance.now()
    await sleep(2000)
    const end = performance.now()
    const dt = end - start
    console.log(dt)

    expect(2).toBe(2)
  })

  it('profile for vs foreach', () => {
    const len = 100000
    const arr = []
    for (let i = 0; i < len; i++) {
      arr[i] = i
    }

    performance.mark('profile_foreach_start')
    const arr2 = []
    arr.forEach((v, idx) => {
      arr2[idx] = v
    })
    performance.mark('profile_foreach_end')
    performance.measure(
      'profile_foreach',
      'profile_foreach_start',
      'profile_foreach_end'
    )
    performance.mark('profile_for_start')
    const arr3 = []
    for (let i = 0; i < arr.length; i++) {
      arr3[i] = arr[i]
    }
    performance.mark('profile_for_end')
    performance.measure('profile_for', 'profile_for_start', 'profile_for_end')

    console.table(perfResults())
  })

  it('profile data access', () => {
    let x = 0
    const u = new Uint32Array(1)
    u[0] = 0
    const mp = new Map<string, number>([['a', 0]])
    const arr = [0]
    const y = { y: 0 }
    const z = { z: { z: { z: 0 } } }
    const iter = 5_000_000
    const bu = performance.now()
    for (let i = 0; i < iter; i++) {
      // @ts-ignore
      u[0] += 1
    }
    const au = performance.now()
    const bm = performance.now()
    for (let i = 0; i < iter; i++) {
      // @ts-ignore
      mp.set('a', mp.get('a') + 1)
    }
    const am = performance.now()
    const ba = performance.now()
    for (let i = 0; i < iter; i++) {
      arr[0] += 1
    }
    const aa = performance.now()
    const bx = performance.now()
    for (let i = 0; i < iter; i++) {
      x += 1
    }
    const ax = performance.now()

    const by = performance.now()
    for (let i = 0; i < iter; i++) {
      y.y += 1
    }
    const ay = performance.now()

    const bz = performance.now()
    const zs = ['z', 'z', 'z']
    // @ts-ignore
    const e = { [zs[0]]: { [zs[1]]: { [z[2]]: 0 } } }
    for (let i = 0; i < iter; i++) {
      // @ts-ignore
      e['z']['z']['z'] += 1
    }
    const az = performance.now()

    console.table({
      u: au - bu,
      m: am - bm,
      a: aa - ba,
      x: ax - bx,
      y: ay - by,
      z: az - bz,
    })
    expect(2).toBe(2)
  })

  it('Using Dictionary vs using native map', () => {
    profile('nativeMap', 'profiles/packages/rete', () => {
      const match = {
        id: 0,
        match: new Map<string, string | number>([
          ['Delta', 'Delta'],
          ['dt', 1],
        ]),
        enabled: true,
      }
      const idAttrs = [
        ['bob', 'age'],
        ['sally', 'age'],
        ['jim', 'age'],
        ['tim', 'age'],
        ['bob', 'name'],
        ['sally', 'name'],
        ['jim', 'name'],
        ['tim', 'name'],
      ]

      const iterCount = 1_000_000

      performance.mark('map_start')
      for (let i = 0; i < iterCount; i++) {
        const m = new Map<string, Map<string, typeof match>>()
        for (const [id, attr] of idAttrs) {
          if (!m.get(id)) m.set(id, new Map([[attr, match]]))
          else m.get(id)?.set(attr, match)
        }
        for (const [id, attr] of idAttrs) {
          m.get(id)?.delete(attr)
          if (m.get(id)?.size === 0) m.delete(id)
        }
      }
      performance.mark('map_end')
      performance.measure('map', 'map_start', 'map_end')

      const charsum = function (s: string) {
        var i,
          sum = 0
        for (i = 0; i < s.length; i++) {
          sum += s.charCodeAt(i) * (i + 1)
        }
        return sum
      }

      const array_hash = function (a: string[][]) {
        var i,
          sum = 0
        for (i = 0; i < a.length; i++) {
          var cs = charsum(a[i][0]) + charsum(a[i][1])
          sum = sum + 65027 / cs
        }
        return ('' + sum).slice(0, 16)
      }
      performance.mark('hash_start')
      for (let i = 0; i < iterCount; i++) {
        array_hash(idAttrs)
      }
      performance.mark('hash_end')
      performance.measure('hash', 'hash_start', 'hash_end')

      performance.mark('toStr_start')
      for (let i = 0; i < iterCount; i++) {
        idAttrs.toString()
      }
      performance.mark('toStr_end')
      performance.measure('toStr', 'toStr_start', 'toStr_end')

      performance.mark('murmur_start')
      for (let i = 0; i < iterCount; i++) {
        const hash = MurmurHash3()
        let result = 0
        for (let idAttr of idAttrs) {
          hash.hash(idAttr[0]).hash(idAttr[1])
        }
        if (result > 0) {
          expect(result).toBe(hash.result())
        } else {
          result = hash.result()
        }
      }
      performance.mark('murmur_end')
      performance.measure('murmur', 'murmur_start', 'murmur_end')

      const javaHash = function (idAttrs: string[][]) {
        var hash = 0,
          i,
          j,
          k,
          chr
        for (i = 0; i < idAttrs.length; i++) {
          for (j = 0; j < idAttrs[i].length; j++) {
            for (k = 0; k < idAttrs[i][j].length; k++) {
              chr = idAttrs[i][j].charCodeAt(k)
              hash = (hash << 5) - hash + chr
              hash |= 0 // Convert to 32bit integer
            }
          }
        }
        return hash
      }

      performance.mark('java_start')
      let jHash = 0
      for (let i = 0; i < iterCount; i++) {
        const result = javaHash(idAttrs)
        if (jHash === 0) jHash = result
        else if (jHash !== result)
          throw new Error(`hash mismatch ${result} vs previous ${jHash}`)
      }
      performance.mark('java_end')
      performance.measure('java', 'java_start', 'java_end')

      const entries = performance
        .getEntriesByType('measure')
        .map((e) => `${e.name}: ${e.duration}`)
        .join('\n')
      console.log(entries)
      expect(2).toBe(2)
    })
  })
})

describe('rete perf', () => {
  it('packed_5', () => {
    // @ts-ignore
    const session = rete.initSession<Schema>(false, { enabled: true })
    const makeProduction = (name: keyof Schema) => {
      const valName = name.toLowerCase()
      const entJoin = '$ent'
      const production = rete.initProduction<Schema, MatchT<Schema>>({
        name,
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
    }
    makeProduction('A')
    makeProduction('B')
    makeProduction('C')
    makeProduction('D')
    makeProduction('E')

    rete.insertFact(session, ['Delta', 'delta', 1])
    const NUM_ENTITIES = 1000
    for (let i = 0; i < NUM_ENTITIES; i++) {
      rete.insertFact(session, [i, 'A', 1])
      rete.insertFact(session, [i, 'B', 1])
      rete.insertFact(session, [i, 'C', 1])
      rete.insertFact(session, [i, 'D', 1])
      rete.insertFact(session, [i, 'E', 1])
    }
    rete.fireRules(session)

    const { hz } = bench('packed5', () => {
      rete.insertFact(session, ['Delta', 'delta', 1])
      rete.fireRules(session)
    })
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
    console.table(results)
    console.log(viz(session))
    expect(hz).toBeGreaterThan(1)
    expect(hz).toBeGreaterThan(10)
    expect(hz).toBeGreaterThan(100)
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
      const production = rete.initProduction<Schema, MatchT<Schema>>({
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
    const NUM_ENTITIES = 10
    for (let i = 0; i < NUM_ENTITIES; i++) {
      const ab = `${i}ab`
      rete.insertFact(session, [ab, 'A', 1])
      rete.insertFact(session, [ab, 'B', 1])
      const abc = `${i}abc`
      rete.insertFact(session, [abc, 'A', 1])
      rete.insertFact(session, [abc, 'B', 1])
      rete.insertFact(session, [abc, 'C', 1])
      const abcd = `${i}abcd`
      rete.insertFact(session, [abcd, 'A', 1])
      rete.insertFact(session, [abcd, 'B', 1])
      rete.insertFact(session, [abcd, 'C', 1])
      rete.insertFact(session, [abcd, 'D', 1])
      const abce = `${i}abce`
      rete.insertFact(session, [abce, 'A', 1])
      rete.insertFact(session, [abce, 'B', 1])
      rete.insertFact(session, [abce, 'C', 1])
      rete.insertFact(session, [abce, 'E', 1])
    }
    rete.fireRules(session)

    // const { hz } = bench(() => {
    //   rete.insertFact(session, ['Delta', 'delta', 1])
    //   rete.fireRules(session)
    // })
    // expect(hz).toBeGreaterThan(0)
    //expect(hz).toBeGreaterThan(1)
    // expect(hz).toBeGreaterThan(10)
    // expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(NUM_ENTITIES).toBeGreaterThan(999)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
  })

  it('frag_iter', () => {
    const session = rete.initSession<Schema>(false)
    const makeProduction = (name: keyof Schema) => {
      const valName = name.toLowerCase()
      const joinId = '$ent'
      const production = rete.initProduction<Schema, MatchT<Schema>>({
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
    const spawnB = rete.initProduction<Schema, MatchT<Schema>>({
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
    const retractB = rete.initProduction<Schema, MatchT<Schema>>({
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
    const NUM_ENTITIES = 100
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
    expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
    // expect(hz).toBeGreaterThan(300_000)
    // expect(hz).toBeGreaterThan(500_000)
  })

  it('add_remove', () => {
    const session = rete.initSession<Schema>(false)
    const joinId = '$ent'
    const spawnB = rete.initProduction<Schema, MatchT<Schema>>({
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
    const retractB = rete.initProduction<Schema, MatchT<Schema>>({
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
    const NUM_ENTITIES = 100
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
    expect(hz).toBeGreaterThan(100)
    // expect(hz).toBeGreaterThan(1000)
    // expect(hz).toBeGreaterThan(10_000)
    // expect(hz).toBeGreaterThan(100_000)
    // expect(hz).toBeGreaterThan(300_000)
    // expect(hz).toBeGreaterThan(500_000)
  })
})
