import { Field, MatchT, rete } from '@edict/rete'
import { FC, useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

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

const packed5 = () => {
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
  const NUM_ENTITIES = 2
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

  const entries = performance
    .getEntriesByType('measure')
    .sort((a, b) => {
      if (a.duration > b.duration) return -1
      else return 1
    })
    .filter((a) => a.name === 'leftActivationOnMemoryNode_leaftrigger')
    .map((a) => ({ startTime: a.startTime, duration: a.duration * 1000 }))
  return {
    hz,
    perf: entries,
  }
}

const simpleIter = () => {
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

  const { hz } = bench(() => {
    rete.insertFact(session, ['Delta', 'delta', 1])
    rete.fireRules(session)
  })
}

const fragIter = () => {
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

  const { hz } = bench(() => {
    rete.insertFact(session, ['Delta', 'delta', 1])
    rete.fireRules(session)
  })
}

const entityCycle = () => {
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

  const { hz } = bench(() => {
    rete.insertFact(session, ['Delta', 'delta', 1])
    rete.fireRules(session)
  })
  // expect(hz).toBeGreaterThan(1000)
  // expect(hz).toBeGreaterThan(10_000)
  // expect(hz).toBeGreaterThan(100_000)
  // expect(hz).toBeGreaterThan(300_000)
  // expect(hz).toBeGreaterThan(500_000)
}

const addRemove = () => {
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

  const { hz } = bench(() => {
    rete.insertFact(session, ['Delta', 'delta', 1])
    rete.fireRules(session)
  })
  // expect(hz).toBeGreaterThan(1000)
  // expect(hz).toBeGreaterThan(10_000)
  // expect(hz).toBeGreaterThan(100_000)
  // expect(hz).toBeGreaterThan(300_000)
  // expect(hz).toBeGreaterThan(500_000)
}

type Packed5Ret = ReturnType<typeof packed5>

const PerfRun: FC<Packed5Ret> = ({ perf }) => {
  return (
    <div>
      <h1>Run Data</h1>
      <LineChart
        width={500}
        height={300}
        data={perf}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="startTime" />
        <YAxis />
        <Line
          type="monotone"
          dataKey="duration"
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </div>
  )
}

export function App() {
  const [run, setRun] = useState<Packed5Ret>()
  return (
    <div>
      <ul>
        <li>
          <label>
            Packed 5{' '}
            <input
              type={'button'}
              value={'Go'}
              onClick={() => {
                console.profile('packed5')
                const result = packed5()
                console.profileEnd('packed5')
                setRun(result)
              }}
            />{' '}
          </label>
        </li>
      </ul>
    </div>
  )
}

export default App
