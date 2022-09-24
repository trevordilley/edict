import {attr, edict} from "@edict/core";

type Characters = [id: number, x: number, y: number][]

type Schema =  {
    DeltaTime: number,
    TotalTime: number,
    X: number,
    Y: number,
    WindowWidth: number,
    WindowHeight: number,
    Width: number,
    Height: number,
    PressedKeys: Set<number>,
    XVelocity: number,
    YVelocity: number,
    XChange: number,
    YChange: number,
    AllCharacters: Characters
  }

describe("Basic Usage", () => {
  it("queries", () => {

    const {rule, insert, fire} = edict<Schema>()
    const br = performance.now()
    const r = rule("queries", ({X, Y}) => ({
        Player: {
          X,
          Y
        }
    }))
     const ar = performance.now()
    const be = performance.now()
    const enacted = r.enact()
    const ae = performance.now()

    const bi = performance.now()
    insert({
      Player: {
        X: 0.0,
        Y: 1.0
      }
    })
    const ai = performance.now()
    const bf = performance.now()
    fire()
    const af = performance.now()

    const bq = performance.now()
    const results = enacted.query()
    const aq = performance.now()

    const dr = ar - br
    const di = ai - bi
    const de = ae - be
    const df = af - bf
    const dq = aq - bq
    console.log(dr, di, de, df, dq)

    expect(results.length).toBe(1)

    const {Player} = results[0]

    expect(Player.X).toBe(0.0)
    expect(Player.Y).toBe(1.0)
  })

  it("avoiding infinite loops", () => {

    const {rule, insert, fire} = edict<Schema>()

    rule("avoiding infiniite loops", ({ DeltaTime}) => ({
        Player: {
          X: {then: false},
        },
        Global: {
          DeltaTime
        }
      ,
    })).enact(
      {
      then: ({ Global, Player}) => {
        console.log("firing")
        insert({Player: {X: Player.X + Global.DeltaTime}})
      }
    }
  )

    const getPlayer = rule("get player", ({X, Y}) => ({
      Player: {
        X,
        Y
      },
    })).enact()

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
