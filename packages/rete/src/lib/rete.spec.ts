import {rete} from './rete';
import {Field, MatchT} from "@edict/rete";

type People = [id: number, color: string, leftOf: number, height: number][]
enum Id {
  Alice, Bob, Charlie, David, George,
  Seth, Thomas, Xavier, Yair, Zach,
  Derived,
}
enum Attr {
  Color, LeftOf, RightOf, Height, On, Age, Self,
  AllPeople,
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
        expect(vars.getValue("a")).toBe(Id.Alice)
        expect(vars.getValue("b")).toBe(Id.Bob)
        expect(vars.getValue("y")).toBe(Id.Yair)
        expect(vars.getValue("z")).toBe(Id.Zach)
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
        expect(vars.getValue("a")).toBe(Id.Alice)
        expect(vars.getValue("b")).toBe(Id.Bob)
        expect(vars.getValue("y")).toBe(Id.Yair)
        expect(vars.getValue("z")).toBe(Id.Zach)
      }

      }
    )

    rete.addConditionsToProduction(production, {name: "x", field: Field.IDENTIFIER}, "RightOf", {name: "y", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "LeftOf", {name: "z", field: Field.VALUE}, true)
    rete.addConditionsToProduction(production, {name: "z", field: Field.IDENTIFIER}, "Color", "red", true)
    rete.addConditionsToProduction(production, {name: "a", field: Field.IDENTIFIER}, "Color", "maize", true)
    rete.addConditionsToProduction(production, {name: "b", field: Field.IDENTIFIER}, "Color", "blue", true)
    rete.addConditionsToProduction(production, {name: "c", field: Field.IDENTIFIER}, "Color", "green", true)
    rete.addConditionsToProduction(production, {name: "d", field: Field.IDENTIFIER}, "Color", "white", true)
    rete.addConditionsToProduction(production, {name: "s", field: Field.IDENTIFIER}, "On", "table", true)
    rete.addConditionsToProduction(production, {name: "y", field: Field.IDENTIFIER}, "RightOf", {name: "b", field: Field.VALUE}, true)
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
});
