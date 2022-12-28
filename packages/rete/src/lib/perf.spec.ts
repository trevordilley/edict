import { rete } from './rete'
import { Field, MatchT } from '@edict/rete'

const bench = (fn: () => void) => {
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
  delta: number
}

const convertMatchFn = (vars: MatchT<Schema>) => vars

// Tests based on these benchmarks: https://github.com/noctjs/ecs-benchmark

describe('rete perf', () => {
  it('packed_5', () => {
    const session = rete.initSession<Schema>(false)
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

    const { hz } = bench(() => {
      rete.insertFact(session, ['Delta', 'delta', 1])
      rete.fireRules(session)
    })
    expect(hz).toBeGreaterThan(1)
    expect(hz).toBeGreaterThan(10)
    expect(hz).toBeGreaterThan(100)
    expect(hz).toBeGreaterThan(1000)
    expect(hz).toBeGreaterThan(10_000)
    expect(hz).toBeGreaterThan(100_000)
    expect(hz).toBeGreaterThan(300_000)
  })
})
