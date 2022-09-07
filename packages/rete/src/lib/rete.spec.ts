import {rete} from './rete';
import {Field} from "@edict/rete";
import {Dictionary, Set as TsSet} from "typescript-collections";

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


describe('rete', () => {
  it('should work', () => {
    const session = rete.initSession<SmallSchema>(false)




    // rule numCondsAndFacts(Fact):
    // what:
    // then:
    //   check a == Alice
    // check b == Bob
    // check y == Yair
    // check z == Zach

    const production = rete.initProduction<SmallSchema>("numCondsAndFacts",
      (vars) => {
        console.log(vars)
        return vars as any},
      (vars) => {
        return true
      },
      (vars) => {
        return vars as any
      } )

    //   (Bob, Color, "blue")
    //   (y, LeftOf, z)
    //   (a, Color, "maize")
    //   (y, RightOf, b)
    //   (x, Height, h)

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
});
