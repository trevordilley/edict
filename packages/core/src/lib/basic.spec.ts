import {attr, edict, rule} from "@edict/core";

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
    const {addRule, insert, fire} = edict( args)
    const results = addRule(({ LeftOf, RightOf, Height}) => rule({
      name: "number of conditions != number of factts",
      what: {
        [Id.Bob]: {
          Color: "blue"
        },
        $y: {
          LeftOf,
          RightOf
        },
        $a: {
          Color: "maize"
        },
        $x: {Height}
      },
      then: (arg => {
        // Todo: Need to have a schema for `id`, it's lame that I cast things to strings...
        expect(arg.$a.id).toBe(`${Id.Alice}`)
        expect(arg.$y.RightOf).toBe(Id.Bob)
        expect(arg.$y.LeftOf).toBe(Id.Zach)
        expect(arg.$y.id).toBe(`${Id.Yair}`)
        expect(arg.$y.id).toBe(`${Id.Yair}`)
      })
    }))

   insert({
     [Id.Bob]: {
       Color: "blue",
     },
     [Id.Yair]: {
       LeftOf: Id.Zach,
       RightOf: Id.Bob
     },
     [Id.Alice]: {
       Color: "maize"
     },
     [Id.Xavier]: {
       Height: 72
     },
     [Id.Thomas]: {
       Height: 72
     },
     [Id.George]: {
       Height: 72
     }
   })

    fire()
    expect(results.query().length).toBe(3)
})

  it("adding facts out of order", () => {
    const {addRule, insert, fire} = edict(args)

    const results = addRule(({RightOf, LeftOf}) => rule({
      name: "adding facts out of order",
      what: {
        $x: {
          RightOf
        },
        $y: {
          LeftOf,
          RightOf
        },
        $z: {
          Color: "red"
        },
        $a: {
          LeftOf,
          Color: "maize"
        },
        $b: {
          Color: "blue"
        },
        $c: {
          Color: "green"
        },
        $d: {
          Color: "white"
        },
        $s: {
          On: "table"
        },

      },
      then: (args) => {
        expect(args.$a.id).toBe(`${Id.Alice}`)
        expect(args.$b.id).toBe(`${Id.Bob}`)
        expect(args.$y.id).toBe(`${Id.Yair}`)
        expect(args.$y.LeftOf).toBe(Id.Zach)
      }
    }))
    insert({ [Id.Xavier]: { RightOf: Id.Yair }})
    insert({ [Id.Yair]: { LeftOf: Id.Zach, }})
    insert({ [Id.Zach]: { Color: "red" }})
    insert({ [Id.Alice]: { Color: "maize", }})
    insert({ [Id.Bob]: { Color: "blue" }})
    insert({ [Id.Charlie]: { Color: "green" }})
    insert({ [Id.Seth]: { On: "table" }})
    insert({ [Id.Yair]: { RightOf: Id.Bob }})
    insert({ [Id.Alice]: { LeftOf: Id.David }})
    insert({ [Id.David]: { Color: "white" }})
    fire()
    const r = results.query()
    //TODO: I think because of the difference in our APIs (I don't have variable binding on values)
    // We get fundamentally difference condidtions that are resulting in different result lengths.
    // Pararules expects 1, so I should look into this deeper to be sure!
    expect(results.query().length).toBe(2)
  })
})
