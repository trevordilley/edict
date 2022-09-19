import {attr, edict} from "@edict/core";

type People = [id: number, color: string, leftOf: number, height: number][]
enum Id {
  Alice, Bob, Charlie, David, George,
  Seth, Thomas, Xavier, Yair, Zach,
  Derived,
}

const args = {factSchema: {
    Color: attr<string>(),
    LeftOf: attr<Id>(),
    RightOf: attr<Id>(),
    Height: attr<number>(),
    On: attr<string>(),
    Age: attr<number>(),
    Self: attr<Id>(),
    AllPeople: attr<People>()
  }}

describe("edict...", () => {
  it("test", () => {
    const {addRule, ...rest} = edict( args)

    const results = addRule(({}))


    // test "number of conditions != number of facts":
    // var session = initSession(Fact)
    // echo(session)
    // let rule1 =
    //   rule numCondsAndFacts(Fact):
    // what:
    //   (Bob, Color, "blue")
    //   (y, LeftOf, z)
    //   (a, Color, "maize")
    //   (y, RightOf, b)
    //   (x, Height, h)
    // then:
    //   check a == Alice
    // check b == Bob
    // check y == Yair
    // check z == Zach
    // session.add(rule1)
    //
    // session.insert(Bob, Color, "blue")
    // session.insert(Yair, LeftOf, Zach)
    // session.insert(Alice, Color, "maize")
    // session.insert(Yair, RightOf, Bob)
    //
    // session.insert(Xavier, Height, 72)
    // session.insert(Thomas, Height, 72)
    // session.insert(George, Height, 72)
    //
    // check session.queryAll(rule1).len == 3

})})
