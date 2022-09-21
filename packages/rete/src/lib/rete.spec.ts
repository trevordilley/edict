import {rete} from './rete';
import {FactFragment, Field, MatchT} from "@edict/rete";

type People = [id: number, color: string, leftOf: number, height: number][]
enum Id {
  Alice, Bob, Charlie, David, George,
  Seth, Thomas, Xavier, Yair, Zach,
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

    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({name: "numCondsAndFacts",
      convertMatchFn,
      thenFn: ( {vars} ) => {
        expect(vars.get("a")).toBe(Id.Alice)
        expect(vars.get("b")).toBe(Id.Bob)
        expect(vars.get("y")).toBe(Id.Yair)
        expect(vars.get("z")).toBe(Id.Zach)
      }
    }
    )


    rete.addConditionsToProduction(production, `${Id.Bob}`, "Color", "blue", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "LeftOf", {name: "z", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "Color", "maize", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "RightOf", {name: "b", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "x", field: Field.IDENTIFIER}, "Height", {name: "h", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, "Color", "blue"])
    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Zach])
    rete.insertFact(session,[Id.Alice, "Color", "maize"])
    rete.insertFact(session,[Id.Yair, "RightOf", Id.Bob])

    rete.insertFact(session,[Id.Xavier, "Height", 72])
    rete.insertFact(session,[Id.Thomas, "Height", 72])
    rete.insertFact(session,[Id.George, "Height", 72])
    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(3)
  });

  it('adding facts out of order', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "outOfOrder",
        convertMatchFn,
      thenFn: ( {vars} ) => {
        expect(vars.get("a")).toBe(Id.Alice)
        expect(vars.get("b")).toBe(Id.Bob)
        expect(vars.get("y")).toBe(Id.Yair)
        expect(vars.get("z")).toBe(Id.Zach)
      }

      }
    )

    // addConditionsToProduction(production, {"name":"id___$x","field":0}, RightOf, {"name":"val___$x_RightOf","field":2}, true)
    rete.addConditionsToProduction(production, {name: "x", field: Field.IDENTIFIER}, "RightOf", {name: "y", field: Field.VALUE}, true)

    // addConditionsToProduction(production, {"name":"id___$y","field":0}, LeftOf, {"name":"val___$y_LeftOf","field":2}, true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "LeftOf", {name: "z", field: Field.VALUE}, true)

    // addConditionsToProduction(production, {"name":"id___$z","field":0}, Color, "red", true)
    rete.addConditionsToProduction(production, {name: "z", field: Field.IDENTIFIER}, "Color", "red", true)

    // addConditionsToProduction(production, {"name":"id___$a","field":0}, Color, "maize", true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "Color", "maize", true)

    // addConditionsToProduction(production, {"name":"id___$b","field":0}, Color, "blue", true)
    rete.addConditionsToProduction(production, {name: "b", field: Field.IDENTIFIER}, "Color", "blue", true)

    // addConditionsToProduction(production, {"name":"id___$c","field":0}, Color, "green", true)
    rete.addConditionsToProduction(production, {name: "c", field: Field.IDENTIFIER}, "Color", "green", true)

    // addConditionsToProduction(production, {"name":"id___$d","field":0}, Color, "white", true)
    rete.addConditionsToProduction(production, {name: "d", field: Field.IDENTIFIER}, "Color", "white", true)

    // addConditionsToProduction(production, {"name":"id___$s","field":0}, On, "table", true)
    rete.addConditionsToProduction(production, {name: "s", field: Field.IDENTIFIER}, "On", "table", true)

    // addConditionsToProduction(production, {"name":"id___$y","field":0}, RightOf, {"name":"val___$y_RightOf","field":2}, true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "RightOf", {name: "b", field: Field.VALUE}, true)

    // addConditionsToProduction(production, {"name":"id___$a","field":0}, LeftOf, {"name":"val___$a_LeftOf","field":2}, true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "LeftOf", {name: "d", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Xavier, "RightOf", Id.Yair])
    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Zach])
    rete.insertFact(session,[Id.Zach, "Color", "red"])
    rete.insertFact(session,[Id.Alice, "Color", "maize"])
    rete.insertFact(session,[Id.Bob, "Color", "blue"])
    rete.insertFact(session,[Id.Charlie, "Color", "green"])

    rete.insertFact(session,[Id.Seth, "On", "table"])
    rete.insertFact(session,[Id.Yair, "RightOf", Id.Bob])
    rete.insertFact(session,[Id.Alice, "LeftOf", Id.David])

    rete.insertFact(session,[Id.David, "Color", "white"])

    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
  });


  it('duplicate facts', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "duplicateFacts",
        convertMatchFn,
      }
    )

    rete.addConditionsToProduction(production, {name: "x", field: Field.IDENTIFIER}, "Self", {name: "y", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "x", field: Field.IDENTIFIER}, "Color", {name: "c", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "Color", {name: "c", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session, [Id.Bob, "Self", Id.Bob])
    rete.insertFact(session,[Id.Bob, "Color", "red"])

    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    expect(results[0].get("c")).toBe("red")

    rete.insertFact(session, [Id.Bob, "Color", "green"])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(1)
    expect(newResults[0].get("c")).toBe("green")
  });

  it('removing facts', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "removingFacts",
        convertMatchFn,
      }
    )

    rete.addConditionsToProduction(production, {name: "b", field: Field.IDENTIFIER}, "Color", "blue", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "LeftOf", {name: "z", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "Color", "maize", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "RightOf", {name: "b", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session,[Id.Bob, "Color", "blue"])
    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Zach])
    rete.insertFact(session,[Id.Alice, "Color", "maize"])
    rete.insertFact(session,[Id.Yair, "RightOf", Id.Bob])

    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)

    rete.retractFact(session, [Id.Yair, "RightOf", Id.Bob])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(0)
  });

  it('updating facts', () => {
    const session = rete.initSession<SmallSchema>(false)
    let zVal: FactFragment<SmallSchema> | undefined= undefined
    let fireCount = 0
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "updatingFacts",
        convertMatchFn,
      thenFn: ({vars}) => {
          fireCount += 1
          zVal = vars.get("z")
      }
      }
    )

    rete.addConditionsToProduction(production, {name: "b", field: Field.IDENTIFIER}, "Color", "blue", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "LeftOf", {name: "z", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "Color", "maize", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "RightOf", {name: "b", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session,[Id.Bob, "Color", "blue"])
    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Zach])
    rete.insertFact(session,[Id.Alice, "Color", "maize"])
    rete.insertFact(session,[Id.Yair, "RightOf", Id.Bob])
    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)
    expect(zVal).toBe(Id.Zach)

    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Xavier])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(1)
    expect(fireCount).toBe(2)
    expect(zVal).toBe(Id.Xavier)


  });


  it('updating facts in different alpha nodes', () => {
    const session = rete.initSession<SmallSchema>(false)
    const production = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "updatingFacts",
        convertMatchFn,
      }
    )

    rete.addConditionsToProduction(production, {name: "b", field: Field.IDENTIFIER}, "Color", "blue", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "LeftOf", Id.Zach, true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "Color", "maize", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "RightOf", {name: "b", field: Field.VALUE}, true)
    rete.addProductionToSession(session, production)
    rete.insertFact(session,[Id.Bob, "Color", "blue"])
    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Zach])
    rete.insertFact(session,[Id.Alice, "Color", "maize"])
    rete.insertFact(session,[Id.Yair, "RightOf", Id.Bob])
    rete.fireRules(session)
    const results = rete.queryAll(session, production)
    expect(results.length).toBe(1)

    rete.insertFact(session,[Id.Yair, "LeftOf", Id.Xavier])
    rete.fireRules(session)
    const newResults = rete.queryAll(session, production)
    expect(newResults.length).toBe(0)


  });

  it('facts can be stored in multiple alpha nodes', () => {
    const session = rete.initSession<SmallSchema>(false)
    let alice: Id
    let zach: Id
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "rule1",
        convertMatchFn,
        thenFn:({vars}) => {
          alice = vars.get("a") as Id
        }
      }
    )
    rete.addConditionsToProduction(rule1, {name: "a", field: Field.IDENTIFIER}, "LeftOf", Id.Zach, true)
    rete.addProductionToSession(session, rule1)
    const rule2 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "rule2",
        convertMatchFn,
        thenFn:({vars}) => {
          zach = vars.get("z") as Id
        }
      }
    )
    rete.addConditionsToProduction(rule2, {name: "a", field: Field.IDENTIFIER}, "LeftOf", {name: "z", field: Field.VALUE}, true)
    rete.addProductionToSession(session, rule2)
    rete.insertFact(session, [Id.Alice, "LeftOf", Id.Zach])
    rete.fireRules(session)
    // @ts-ignore
    expect(alice).toBe(Id.Alice)
    // @ts-ignore
    expect(zach).toBe(Id.Zach)
  });


  it('multiple joins', () => {
    const session = rete.initSession<SmallSchema>(false)
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "rule1",
        convertMatchFn,
      condFn: (vars) => {
          return vars.get("id2") != vars.get("id1")
      },
      thenFn: ({vars, session}) => {
         rete.insertFact(session, [vars.get("id2")! as Id, "Color", "red"])
        rete.insertFact(session, [vars.get("id2")! as Id, "Height", 72])
      }

      })
    rete.addConditionsToProduction(rule1, {name: "id1", field: Field.IDENTIFIER}, "LeftOf", Id.Bob, true)
    rete.addConditionsToProduction(rule1, {name: "id1", field: Field.IDENTIFIER}, "Color", {name: "color", field: Field.VALUE}, true)
    rete.addConditionsToProduction(rule1, {name: "id1", field: Field.IDENTIFIER}, "Height", {name: "height", field: Field.VALUE}, true)
    rete.addConditionsToProduction(rule1, {name: "id2", field: Field.IDENTIFIER}, "LeftOf", {name: "leftOf", field: Field.VALUE}, true)
    rete.addConditionsToProduction(rule1, {name: "id2", field: Field.IDENTIFIER}, "Color", {name: "color2", field: Field.VALUE}, false)
    rete.addConditionsToProduction(rule1, {name: "id2", field: Field.IDENTIFIER}, "Height", {name: "height2", field: Field.VALUE}, false)
    rete.addProductionToSession(session, rule1)

    rete.insertFact(session, [Id.Alice, "LeftOf", Id.Bob])
    rete.insertFact(session, [Id.Alice, "Color", "blue"])
    rete.insertFact(session, [Id.Alice, "Height", 60])
    rete.insertFact(session, [Id.Bob, "LeftOf", Id.Charlie])
    rete.insertFact(session, [Id.Bob, "Color", "green"])
    rete.insertFact(session, [Id.Bob, "Height", 70])

    rete.fireRules(session)

    expect(rete.queryAll(session, rule1).length).toBe(1)
  });

  it('join followed by non-join', () => {
    const session = rete.initSession<SmallSchema>(false)
    const rule1 = rete.initProduction<SmallSchema, MatchT<SmallSchema>>({
        name: "rule1",
        convertMatchFn,
      }
    )
    rete.addConditionsToProduction(rule1, {name: "id1", field: Field.IDENTIFIER}, "LeftOf", Id.Bob, true)
    rete.addConditionsToProduction(rule1, {name: "id1", field: Field.IDENTIFIER}, "Color", {name: "color", field: Field.VALUE}, true)
    rete.addConditionsToProduction(rule1, {name: "id1", field: Field.IDENTIFIER}, "Height", {name: "height", field: Field.VALUE}, true)
    rete.addConditionsToProduction(rule1, Id.Bob, "RightOf", {name: "a", field: Field.VALUE}, true)
    rete.addProductionToSession(session, rule1)

    rete.insertFact(session, [Id.Bob, "RightOf", Id.Alice])
    rete.insertFact(session, [Id.Alice, "LeftOf", Id.Bob])
    rete.insertFact(session, [Id.Alice, "Color", "blue"])
    rete.insertFact(session, [Id.Alice, "Height", 60])
    rete.insertFact(session, [Id.Charlie, "LeftOf", Id.Bob])
    rete.insertFact(session, [Id.Charlie, "Color", "green"])
    rete.insertFact(session, [Id.Charlie, "Height", 70])

    rete.fireRules(session)

    expect(rete.queryAll(session, rule1).length).toBe(2)
  });


});
