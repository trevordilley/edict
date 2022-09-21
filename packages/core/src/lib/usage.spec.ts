import {attr, edict, rule} from "@edict/core";

type Characters = [id: number, x: number, y: number][]

const args = {factSchema: {
    DeltaTime: attr<number>(),
    TotalTime: attr<number>(),
    X: attr<number>(),
    Y: attr<number>(),
    WindowWidth: attr<number>(),
    WindowHeight: attr<number>(),
    Width: attr<number>(),
    Height: attr<number>(),
    PressedKeys: attr<Set<number>>(),
    XVelocity: attr<number>(),
    YVelocity: attr<number>(),
    XChange: attr<number>(),
    YChange: attr<number>(),
    AllCharacters: attr<Characters>()
  }}

describe("Basic Usage", () => {
  it("queries", () => {

    const {addRule, insert, fire} = edict(args)

    const results = addRule(({X, Y}) => rule({
      name: "adding facts out of order",
      what: {
        Player: {
          X,
          Y
        }
      }
    }))

    insert({
      Player: {
        X: 0.0,
        Y: 1.0
      }
    })

    expect(results.query().length).toBe(1)

    const {Player} = results.query()[0]

    expect(Player.X).toBe(0.0)
    expect(Player.Y).toBe(1.0)
  })

  it("avoiding infinite loops", () => {

    const {addRule, insert, fire} = edict(args)

    addRule(({ X_ONCE, DeltaTime}) => rule({
      name: "move player",
      what: {
        Player: {
          X_ONCE,
        },
        Global: {
          DeltaTime
        }
      },
      then: (({ Global}) => {
        console.log("firing")
        insert({Player: {X: 0 + Global.DeltaTime}})
      })
    }))

    const getPlayer = addRule(({X, Y}) => rule({
      name: "get player",
      what: {
        Player: {
          X,
          Y
        },
      }
    }))

    insert({
      Player: {
        X: 0.0,
        Y: 1.0
      },
      Global: {
        DeltaTime: 0.5
      }
    })
    fire()
    expect(getPlayer.query()[0].Player.X).toBe(0.5)
  })
})
