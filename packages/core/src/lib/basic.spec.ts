import {  edict } from '@edict/core';

type People = [id: number, color: string, leftOf: number, height: number][];
enum Id {
  Alice = "Alice",
  Bob = "Bob",
  Charlie = "Charlie",
  David = "David",
  George = "George",
  Seth = "Seth",
  Thomas = "Thomas",
  Xavier = "Xavier",
  Yair = "Yair",
  Zach = "Zach",
  Derived = "Derived",
}

type Schema = {
    Color: string,
    LeftOf: Id,
    RightOf: Id,
    Height: number,
    On: string,
    Age: number,
    Self: Id,
    AllPeople: People,
};

describe('edict...', () => {
  it('test', () => {
    const { rule, insert, fire } = edict<Schema>();
    const results = rule('number of conditions != number of facts', ({ LeftOf, RightOf, Height }) =>
      ({
          [Id.Bob]: {
            Color: {match: 'blue'},
          },
          $y: {
            LeftOf,
            RightOf,
          },
          $a: {
            Color: {match: 'maize'},
          },
          $x: { Height },
        })).enact({

      then: (arg) => {
        // Todo: Need to have a schema for `id`, it's lame that I cast things to strings...
        expect(arg.$a.id).toBe(Id.Alice);
        expect(arg.$y.RightOf).toBe(Id.Bob);
        expect(arg.$y.LeftOf).toBe(Id.Zach);
        expect(arg.$y.id).toBe(Id.Yair);
      },
    })
    results.subscribe(results => {
      expect(results.length).toBe(3);
    })
    insert({
      [Id.Bob]: {
        Color: 'blue',
      },
      [Id.Yair]: {
        LeftOf: Id.Zach,
        RightOf: Id.Bob,
      },
      [Id.Alice]: {
        Color: 'maize',
      },
      [Id.Xavier]: {
        Height: 72,
      },
      [Id.Thomas]: {
        Height: 72,
      },
      [Id.George]: {
        Height: 72,
      },
    });

    fire();
    expect(results.query().length).toBe(3);
  });

  it("out-of-order joins between id and value",() => {

    const { rule, insert, fire } = edict<Schema>();
    const results = rule("out-of-order", ({Color}) => ({
      $b: {
        RightOf: {match: Id.Alice},
        Color: {match: "blue"}
      },
      $y: {
        RightOf: {join: "$b"}
      }
    })).enact()

    insert({
      [Id.Bob]: {
        RightOf: Id.Alice,
        Color: "blue"
      },
      [Id.Yair]: {
        RightOf: Id.Bob
      }
    })

    fire()

    expect(results.query().length).toBe(1)
  })

// this was failing because we weren't testing conditions
// in join nodes who are children of the root memory node
  it("simple conditions", () => {
    const {rule, insert, fire} = edict<Schema>()
    let count = 0
    const results = rule("simple", ({Color}) => ({
      $b: {
        Color: {match: "blue"}
      }
    })).enact({
      when: () => false,
      then: () => count += 1
    })

    insert({
      [Id.Bob]: {
        Color: "blue"
      }
    })

    fire()

    expect(count).toBe(0)
  })


  it("join value with id", () => {
    const {insert, fire, rule} = edict<Schema>(true)

    const results = rule("join", ({Color, Height}) => ({
      [Id.Bob]: {
        LeftOf: {join: "$id"},
      },
      $id: {
        Color,
        Height
      }
    })).enact()

    insert({
      [Id.Alice]: {
        Color: "blue",
        Height: 60
      },
      [Id.Bob]: {
        LeftOf: Id.Alice,
      }
    })

    insert({
      [Id.Charlie]: {
        Color: "green",
        Height: 72
      },
      [Id.Bob]: {
        LeftOf: Id.Charlie
      }
    })

    expect(results.query().length).toBe(1)
  })

  it('adding facts out of order', () => {
    const { rule, insert, fire } = edict<Schema>();

    const results = rule('adding facts out of order', ({ RightOf, LeftOf }) =>
      ({
          $x: {
            RightOf: {join: "$y"},
          },
          $y: {
            LeftOf: {join: "$z"},
            RightOf: {join: "$b"},
          },
          $z: {
            Color: {match: 'red'},
          },
          $a: {
            LeftOf: {join: "$d"},
            Color: {match: 'maize'},
          },
          $b: {
            Color: {match: 'blue'},
          },
          $c: {
            Color: {match: 'green'},
          },
          $d: {
            Color: {match: 'white'},
          },
          $s: {
            On: {match: 'table'},
          },
      })).enact({
      then: (args) => {
        expect(args.$a.id).toBe(Id.Alice);
        expect(args.$b.id).toBe(Id.Bob);
        expect(args.$y.id).toBe(Id.Yair);
        expect(args.$z.id).toBe(Id.Zach);
      },
    })
    insert({ [Id.Xavier]: { RightOf: Id.Yair } });
    insert({ [Id.Yair]: { LeftOf: Id.Zach } });
    insert({ [Id.Zach]: { Color: 'red' } });
    insert({ [Id.Alice]: { Color: 'maize' } });
    insert({ [Id.Bob]: { Color: 'blue' } });
    insert({ [Id.Charlie]: { Color: 'green' } });
    insert({ [Id.Seth]: { On: 'table' } });
    insert({ [Id.Yair]: { RightOf: Id.Bob } });
    insert({ [Id.Alice]: { LeftOf: Id.David } });
    insert({ [Id.David]: { Color: 'white' } });
    fire();
    expect(results.query().length).toBe(1);
  });
});
