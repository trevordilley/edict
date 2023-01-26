import { rete } from './rete'
import { FactFragment, Field, MatchT } from './types'
import { viz, vizOnlineUrl } from '@edict/rete'

type People = [id: number, color: string, leftOf: number, height: number][]
enum Id {
  Alice,
  Bob,
  Charlie,
  David,
  George,
  Seth,
  Thomas,
  Xavier,
  Yair,
  Zach,
  Derived,
}

interface SmallSchema {
  Color: string
  LeftOf: Id
  RightOf: Id
  Height: number
  On: string
  Age: number
  Self: Id
  AllPeople: People
}

const convertMatchFn = (vars: MatchT<SmallSchema>) => vars

describe('rete', () => {
  it('number of conditions != number of facts', () => {
    const session = rete.initSession<SmallSchema>(false)

    let subResultsAllResults: MatchT<SmallSchema>[] = []
    let subResultsGeorgeAndThomas: MatchT<SmallSchema>[] = []
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'numCondsAndFacts',
      convertMatchFn,
      thenFn: ({ vars }) => {
        expect(vars.get('a')).toBe(Id.Alice)
        expect(vars.get('b')).toBe(Id.Bob)
        expect(vars.get('y')).toBe(Id.Yair)
        expect(vars.get('z')).toBe(Id.Zach)
      },
    })
    rete.subscribeToProduction(session, production, (results) => {
      subResultsAllResults = results
    })
    rete.subscribeToProduction(
      session,
      production,
      (results) => {
        subResultsGeorgeAndThomas = results
      },
      new Map([['x', [Id.George, Id.Thomas]]])
    )
    rete.addConditionsToProduction(
      production,
      `${Id.Bob}`,
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'z', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      'maize',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'b', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'x', field: Field.IDENTIFIER },
      'Height',
      { name: 'h', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Zach])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    rete.insertFact(session, [Id.Yair, 'RightOf', Id.Bob])

    rete.insertFact(session, [Id.Xavier, 'Height', 72])
    rete.insertFact(session, [Id.Thomas, 'Height', 72])
    rete.insertFact(session, [Id.George, 'Height', 72])
    rete.fireRules(session)
    console.log(vizOnlineUrl(session))
    const unfilteredResults = rete.queryAll(session, production)
    expect(unfilteredResults.length).toBe(3)
    expect(subResultsAllResults).toStrictEqual(unfilteredResults)
    expect(subResultsGeorgeAndThomas.length).toBe(2)
    const justGeorge = rete.queryAll(
      session,
      production,
      new Map([['x', [Id.George]]])
    )
    expect(justGeorge.length).toBe(1)
  })

  it('adding facts out of order', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'outOfOrder',
      convertMatchFn,
      thenFn: ({ vars }) => {
        expect(vars.get('a')).toBe(Id.Alice)
        expect(vars.get('b')).toBe(Id.Bob)
        expect(vars.get('y')).toBe(Id.Yair)
        expect(vars.get('z')).toBe(Id.Zach)
      },
    })

    let subResults: MatchT<SmallSchema>[] = []
    rete.subscribeToProduction(session, production, (results) => {
      subResults = results
    })

    rete.addConditionsToProduction(
      production,
      { name: 'x', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'y', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'z', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'z', field: Field.IDENTIFIER },
      'Color',
      'red',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      'maize',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'c', field: Field.IDENTIFIER },
      'Color',
      'green',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'd', field: Field.IDENTIFIER },
      'Color',
      'white',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 's', field: Field.IDENTIFIER },
      'On',
      'table',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'b', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'd', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Xavier, 'RightOf', Id.Yair])
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Zach])
    rete.insertFact(session, [Id.Zach, 'Color', 'red'])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    rete.insertFact(session, [Id.Charlie, 'Color', 'green'])
    rete.insertFact(session, [Id.Seth, 'On', 'table'])
    rete.insertFact(session, [Id.Yair, 'RightOf', Id.Bob])

    // TODO: due to hash change: "Alice", "LeftOf", "David" fails if it's not after "David", "Color", "white"
    rete.insertFact(session, [Id.Alice, 'LeftOf', Id.David])
    rete.insertFact(session, [Id.David, 'Color', 'white'])

    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    expect(subResults).toStrictEqual(results)

    const facts = rete.queryFullSession(session)
  })

  it('inserting inside a rule can trigger rule more than once', () => {
    let count = 0

    const session = rete.initSession<SmallSchema>(true)
    const firstRuleProd = rete.initProduction<SmallSchema, MatchT<SmallSchema>>(
      {
        name: 'firstRule',
        convertMatchFn,
        thenFn: () => {
          rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
          rete.insertFact(session, [Id.Charlie, 'Color', 'gold'])
        },
      }
    )
    rete.addConditionsToProduction(
      firstRuleProd,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addProductionToSession(session, firstRuleProd)
    const secondRule = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'secondRule',
      convertMatchFn,
      thenFn: (vars) => {
        count++
      },

      // First then trigger after outer second insert:
      //  {  "c1" : "red", "otherPerson": 1, "c2": "blue" }
      // After first then insert
      //  {  "c1" : "maize", "otherPerson": 1, "c2": "blue" }
      // After second then insert
      //  {  "c1" : "maize", "otherPerson": 2, "c2": "gold" }

      // When not making new maps, then...
      // First then trigger after outer second insert:
      //  {  "c1" : "red", "otherPerson": 1, "c2": "blue" }
      // SKIPS FIRST THEN INSERT
      // After second then insert
      //  {  "c1" : "maize", "otherPerson": 2, "c2": "gold" }
      condFn: (vars) => {
        return vars.get('otherPerson') != Id.Alice
      },
    })
    rete.addConditionsToProduction(
      secondRule,
      Id.Alice,
      'Color',
      { name: 'c1', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      secondRule,
      { name: 'otherPerson', field: Field.IDENTIFIER },
      'Color',
      { name: 'c2', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, secondRule)

    rete.insertFact(session, [Id.Alice, 'Color', 'red'])
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    console.log(vizOnlineUrl(session))
    expect(count).toBe(3)
  })

  it('duplicate facts', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'duplicateFacts',
      convertMatchFn,
    })
    let subResults: MatchT<SmallSchema>[] = []
    rete.subscribeToProduction(session, production, (results) => {
      subResults = results
    })
    rete.addConditionsToProduction(
      production,
      { name: 'x', field: Field.IDENTIFIER },
      'Self',
      { name: 'y', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'x', field: Field.IDENTIFIER },
      'Color',
      { name: 'c', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'Color',
      { name: 'c', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, 'Self', Id.Bob])
    rete.insertFact(session, [Id.Bob, 'Color', 'red'])

    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    expect(subResults).toStrictEqual(results)
    expect(results[0].get('c')).toBe('red')

    rete.insertFact(session, [Id.Bob, 'Color', 'green'])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(1)
    expect(subResults).toStrictEqual(newResults)
    expect(newResults[0].get('c')).toBe('green')
  })

  it('removing facts', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'removingFacts',
      convertMatchFn,
    })

    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'z', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      'maize',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'b', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Zach])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    rete.insertFact(session, [Id.Yair, 'RightOf', Id.Bob])

    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)

    rete.retractFact(session, [Id.Yair, 'RightOf', Id.Bob])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(0)
  })

  it('updating facts', async () => {
    const session = rete.initSession<SmallSchema>(false)
    let zVal: FactFragment<SmallSchema> | undefined = undefined
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'updatingFacts',
      convertMatchFn,
      thenFn: ({ vars }) => {
        zVal = vars.get('z')
      },
    })

    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'z', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      'maize',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'b', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Zach])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    rete.insertFact(session, [Id.Yair, 'RightOf', Id.Bob])
    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    expect(zVal).toBe(Id.Zach)

    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Xavier])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(1)
    //   expect(thenCount).toBe(2) // We have a bug where then isn't triggering again too reassign zVal to Xavier
    expect(zVal).toBe(Id.Xavier)

    console.log(rete.queryFullSession(session))
  })

  it('updating facts asynchronously', async () => {
    const session = rete.initSession<SmallSchema>(false)
    let zVal: FactFragment<SmallSchema> | undefined = undefined
    let thenFinallyCount = 0
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'updatingFacts',
      convertMatchFn,
      thenFn: async ({ vars }) => {
        const p = await new Promise<FactFragment<SmallSchema> | undefined>(
          (resolve) => resolve(vars.get('z'))
        )
        zVal = p
      },
      thenFinallyFn: async () => {
        await new Promise<void>((resolve) => {
          thenFinallyCount++
          resolve()
        })
      },
    })

    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'z', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      'maize',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'b', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Zach])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    rete.insertFact(session, [Id.Yair, 'RightOf', Id.Bob])
    rete.fireRules(session)

    // We need to skip a frame so the promise has a chance to resolve
    await new Promise((r) => setTimeout(r, 0))
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    expect(zVal).toBe(Id.Zach)
    expect(thenFinallyCount).toBe(1)

    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Xavier])
    rete.fireRules(session)

    // Same here, the normal use-case for these async then and thenFinally statements is more appropriate for
    // a long run application that's doing side-effecty thing, so it looks weird in a test
    await new Promise((r) => setTimeout(r, 0))
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(1)
    expect(zVal).toBe(Id.Xavier)
    expect(thenFinallyCount).toBe(2)
  })

  it('updating facts in different alpha nodes', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'updatingFacts',
      convertMatchFn,
    })

    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'LeftOf',
      Id.Zach,
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      'maize',
      true
    )
    rete.addConditionsToProduction(
      production,
      { name: 'y', field: Field.IDENTIFIER },
      'RightOf',
      { name: 'b', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    console.log('fire0', vizOnlineUrl(session))
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Zach])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    rete.insertFact(session, [Id.Yair, 'RightOf', Id.Bob])
    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    rete.insertFact(session, [Id.Yair, 'LeftOf', Id.Xavier])
    console.log('fire2', vizOnlineUrl(session))
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(0)
  })

  it('facts can be stored in multiple alpha nodes', () => {
    const session = rete.initSession<SmallSchema>(false)
    let alice: Id
    let zach: Id
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
      thenFn: ({ vars }) => {
        alice = vars.get('a') as Id
      },
    })
    rete.addConditionsToProduction(
      rule1,
      { name: 'a', field: Field.IDENTIFIER },
      'LeftOf',
      Id.Zach,
      true
    )
    rete.addProductionToSession(session, rule1)
    const rule2 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule2',
      convertMatchFn,
      thenFn: ({ vars }) => {
        zach = vars.get('z') as Id
      },
    })
    rete.addConditionsToProduction(
      rule2,
      { name: 'a', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'z', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, rule2)
    rete.insertFact(session, [Id.Alice, 'LeftOf', Id.Zach])
    rete.fireRules(session)
    console.log(viz(session))
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(alice).toBe(Id.Alice)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(zach).toBe(Id.Zach)
  })

  it('multiple joins', () => {
    const session = rete.initSession<SmallSchema>(false)
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
      condFn: (vars) => {
        return vars.get('id2') != vars.get('id1')
      },
      thenFn: ({ vars, session }) => {
        rete.insertFact(session, [vars.get('id2')! as Id, 'Color', 'red'])
        rete.insertFact(session, [vars.get('id2')! as Id, 'Height', 72])
      },
    })
    rete.addConditionsToProduction(
      rule1,
      { name: 'id1', field: Field.IDENTIFIER },
      'LeftOf',
      Id.Bob,
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id1', field: Field.IDENTIFIER },
      'Color',
      { name: 'color', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id1', field: Field.IDENTIFIER },
      'Height',
      { name: 'height', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id2', field: Field.IDENTIFIER },
      'LeftOf',
      { name: 'leftOf', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id2', field: Field.IDENTIFIER },
      'Color',
      { name: 'color2', field: Field.VALUE },
      false
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id2', field: Field.IDENTIFIER },
      'Height',
      { name: 'height2', field: Field.VALUE },
      false
    )
    rete.addProductionToSession(session, rule1)

    rete.insertFact(session, [Id.Alice, 'LeftOf', Id.Bob])
    rete.insertFact(session, [Id.Alice, 'Color', 'blue'])
    rete.insertFact(session, [Id.Alice, 'Height', 60])
    rete.insertFact(session, [Id.Bob, 'LeftOf', Id.Charlie])
    rete.insertFact(session, [Id.Bob, 'Color', 'green'])
    rete.insertFact(session, [Id.Bob, 'Height', 70])

    rete.fireRules(session)

    expect(rete.queryAll(session, rule1).length).toBe(1)
  })

  it('join followed by non-join', () => {
    const session = rete.initSession<SmallSchema>(false)
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      rule1,
      { name: 'id1', field: Field.IDENTIFIER },
      'LeftOf',
      Id.Bob,
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id1', field: Field.IDENTIFIER },
      'Color',
      { name: 'color', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'id1', field: Field.IDENTIFIER },
      'Height',
      { name: 'height', field: Field.VALUE },
      true
    )
    rete.addConditionsToProduction(
      rule1,
      Id.Bob,
      'RightOf',
      { name: 'a', field: Field.VALUE },
      true
    )
    rete.addProductionToSession(session, rule1)

    rete.insertFact(session, [Id.Bob, 'RightOf', Id.Alice])
    rete.insertFact(session, [Id.Alice, 'LeftOf', Id.Bob])
    rete.insertFact(session, [Id.Alice, 'Color', 'blue'])
    rete.insertFact(session, [Id.Alice, 'Height', 60])
    rete.insertFact(session, [Id.Charlie, 'LeftOf', Id.Bob])
    rete.insertFact(session, [Id.Charlie, 'Color', 'green'])
    rete.insertFact(session, [Id.Charlie, 'Height', 70])

    rete.fireRules(session)
    const result = rete.queryAll(session, rule1)
    expect(rete.queryAll(session, rule1).length).toBe(2)
  })

  it("don't trigger rule when updating certain facts", () => {
    const session = rete.initSession<SmallSchema>(true)
    let count = 0
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
      thenFn: () => {
        count = count + 1
      },
    })
    rete.addConditionsToProduction(
      rule1,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )
    rete.addConditionsToProduction(
      rule1,
      { name: 'a', field: Field.IDENTIFIER },
      'Color',
      { name: 'c', field: Field.VALUE },
      false
    )
    rete.addProductionToSession(session, rule1)

    rete.insertFact(session, [Id.Bob, 'Color', 'blue'])
    rete.insertFact(session, [Id.Alice, 'Color', 'red'])
    rete.insertFact(session, [Id.Alice, 'Color', 'maize'])
    console.log(viz(session))
    expect(count).toBe(1)
  })

  it('subscriptions do not fire when inserting facts that are not related to the production', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )

    rete.addProductionToSession(session, production)
    let fired = false
    rete.subscribeToProduction(session, production, () => {
      fired = true
    })

    rete.insertFact(session, ['Bill', 'LeftOf', 'Bob'])
    rete.fireRules(session)

    expect(fired).toBe(false)

    rete.insertFact(session, ['Bill', 'Color', 'blue'])
    expect(fired).toBe(false)
    rete.fireRules(session)
    expect(fired).toBe(true)
  })

  it('subscribing, unsubscribing, resubscribing works', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )

    rete.addProductionToSession(session, production)
    let fireCount = 0
    const unsub = rete.subscribeToProduction(session, production, () => {
      fireCount++
    })

    rete.insertFact(session, ['Bob', 'Color', 'blue'])
    rete.fireRules(session)

    expect(fireCount).toBe(1)
    unsub()
    rete.insertFact(session, ['Bill', 'Color', 'blue'])
    expect(fireCount).toBe(1)
    rete.fireRules(session)
    expect(fireCount).toBe(1)

    rete.subscribeToProduction(session, production, () => {
      fireCount++
    })
    rete.insertFact(session, ['Hank', 'Color', 'blue'])
    expect(fireCount).toBe(1)
    rete.fireRules(session)
    expect(fireCount).toBe(2)
  })

  it('multiple subscriptions work', () => {
    const session = rete.initSession<SmallSchema>(true)
    const colorProd = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'color',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      colorProd,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )

    rete.addProductionToSession(session, colorProd)

    const leftOfProd = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'leftOf',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      leftOfProd,
      { name: 'l', field: Field.IDENTIFIER },
      'LeftOf',
      'Bob',
      true
    )

    rete.addProductionToSession(session, leftOfProd)

    const rightOfProd = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rightOf',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      rightOfProd,
      { name: 'r', field: Field.IDENTIFIER },
      'RightOf',
      'Bill',
      true
    )

    rete.addProductionToSession(session, rightOfProd)
    let colorFired = 0
    let leftFired = 0
    let rightFired = 0
    const unsubColor = rete.subscribeToProduction(session, colorProd, () => {
      colorFired++
    })
    const unsubLeft = rete.subscribeToProduction(session, leftOfProd, () => {
      leftFired++
    })
    const unsubRight = rete.subscribeToProduction(session, rightOfProd, () => {
      rightFired++
    })

    rete.insertFact(session, ['Bob', 'Color', 'blue'])
    expect(colorFired).toBe(1)
    expect(leftFired).toBe(0)
    expect(rightFired).toBe(0)
    rete.insertFact(session, ['Bill', 'LeftOf', 'Bob'])
    expect(colorFired).toBe(1)
    expect(leftFired).toBe(1)
    expect(rightFired).toBe(0)
    rete.insertFact(session, ['Hank', 'RightOf', 'Bill'])
    expect(colorFired).toBe(1)
    expect(leftFired).toBe(1)
    expect(rightFired).toBe(1)
    unsubLeft()
    unsubRight()
    unsubColor()
    rete.insertFact(session, ['Jill', 'Color', 'blue'])
    rete.insertFact(session, ['George', 'LeftOf', 'Bob'])
    rete.insertFact(session, ['Jerry', 'RightOf', 'Bill'])
    expect(colorFired).toBe(1)
    expect(leftFired).toBe(1)
    expect(rightFired).toBe(1)

    rete.subscribeToProduction(session, colorProd, () => {
      colorFired++
    })
    rete.subscribeToProduction(session, leftOfProd, () => {
      leftFired++
    })
    rete.subscribeToProduction(session, rightOfProd, () => {
      rightFired++
    })

    rete.insertFact(session, ['Tom', 'Color', 'blue'])
    expect(colorFired).toBe(2)
    expect(leftFired).toBe(1)
    expect(rightFired).toBe(1)
    rete.insertFact(session, ['Tilly', 'LeftOf', 'Bob'])
    expect(colorFired).toBe(2)
    expect(leftFired).toBe(2)
    expect(rightFired).toBe(1)
    rete.insertFact(session, ['Billy', 'RightOf', 'Bill'])
    expect(colorFired).toBe(2)
    expect(leftFired).toBe(2)
    expect(rightFired).toBe(2)
  })

  it('retractions trigger subscriptions', () => {
    const session = rete.initSession<SmallSchema>(true)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )

    rete.addProductionToSession(session, production)
    let fireCount = 0
    rete.subscribeToProduction(session, production, () => {
      fireCount++
    })
    rete.insertFact(session, ['Bill', 'Color', 'blue'])

    expect(fireCount).toBe(1)

    rete.insertFact(session, ['Bob', 'Color', 'blue'])
    expect(fireCount).toBe(2)
    rete.retractFact(session, ['Bob', 'Color', 'blue'])
    expect(fireCount).toBe(3)
  })

  it('Firing rules several times in a row does not trigger subscription', () => {
    const session = rete.initSession<SmallSchema>()
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
      name: 'rule1',
      convertMatchFn,
    })
    rete.addConditionsToProduction(
      production,
      { name: 'b', field: Field.IDENTIFIER },
      'Color',
      'blue',
      true
    )

    rete.addProductionToSession(session, production)
    let fireCount = 0
    rete.subscribeToProduction(session, production, () => {
      fireCount++
    })
    rete.insertFact(session, ['Bill', 'Color', 'blue'])
    rete.fireRules(session)
    rete.fireRules(session)
    rete.fireRules(session)
    expect(fireCount).toBe(1)
  })
})
