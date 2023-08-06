import { Field, MatchT, rete, Session } from '@edict/rete'

interface Schema {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
  g: number
}

const convertMatchFn = (vars: MatchT<Schema>) => vars

const makeCyclicProduction = (
  session: Session<Schema>,
  cur: keyof Schema,
  next: keyof Schema
) => {
  const production = rete.initProduction<Schema, MatchT<Schema>>({
    name: `${cur}_${next}`,
    convertMatchFn,
    thenFn: ({ vars }) => {
      rete.insertFact(session, ['npc', next, (vars.get('x')! as number) + 1])
      console.log('inserting>?')
    },
  })
  rete.addConditionsToProduction(
    production,
    { name: 'y', field: Field.IDENTIFIER },
    cur,
    { name: 'x', field: Field.VALUE },
    true
  )
  rete.addProductionToSession(session, production)
}
describe('raiseRecursionLimit...', () => {
  it('describes cycle running over several rules', () => {
    const session = rete.initSession<Schema>(false)

    makeCyclicProduction(session, 'b', 'c')
    // Cycle technically starts here
    makeCyclicProduction(session, 'a', 'b')
    makeCyclicProduction(session, 'd', 'e')
    makeCyclicProduction(session, 'e', 'f')
    // And ends here. Let's see how they show up on the output
    makeCyclicProduction(session, 'g', 'a')
    makeCyclicProduction(session, 'c', 'd')
    makeCyclicProduction(session, 'f', 'g')
    rete.insertFact(session, ['npc', 'a', 1])
    rete.fireRules(session)
  })

  it('describes cycles correctly', () => {
    const session = rete.initSession<Schema>(false)

    makeCyclicProduction(session, 'a', 'a')
    rete.insertFact(session, ['npc', 'a', 1])
    rete.fireRules(session)
  })

  it('detects correct cyle even if other rules present', () => {
    const session = rete.initSession<Schema>(false)
  })

  it('productions with lots of other conditions?', () => {
    const session = rete.initSession<Schema>(false)
  })
})
