import { Field, MatchT } from '@edict/rete'
import { initSession } from '../lib/initSession/initSession'
import { initProduction } from '../lib/initProduction/initProduction'
import { addProductionToSession } from '../lib/addProductionToSession/addProductionToSession'
import { addConditionsToProduction } from '../lib/addConditionsToProduction/addConditionsToProduction'

export interface TestingSchema {
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

const convertMatchFn = (vars: MatchT<TestingSchema>) => vars
export const testingSimpleSession = () => {
  const session = initSession<TestingSchema>(false)
  const makeProduction = (name: keyof TestingSchema) => {
    const valName = name.toLowerCase()
    const entJoin = '$ent'
    const production = initProduction<TestingSchema, MatchT<TestingSchema>>({
      name: `${name} production`,
      convertMatchFn,
      thenFn: ({ vars }) => {},
    })
    addConditionsToProduction(
      production,
      { name: 'Delta', field: Field.IDENTIFIER },
      'delta',
      { name: 'dt', field: Field.VALUE },
      true
    )
    addConditionsToProduction(
      production,
      { name: entJoin, field: Field.IDENTIFIER },
      name,
      { name: valName, field: Field.VALUE },
      false
    )
    addProductionToSession(session, production)
    return production
  }
  makeProduction('A')
  return session
}

describe('Simple testing session...', () => {
  it('has one production', () => {
    const session = testingSimpleSession()
    expect([...session.leafNodes.values()].length).toBe(1)
  })
})
