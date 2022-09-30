import {  edict } from '@edict/core';

type People = [id: number, color: string, leftOf: number, height: number][];
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
    const results = rule('number of conditions != number of factts', ({ LeftOf, RightOf, Height }) =>
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
        expect(arg.$a.id).toBe(`${Id.Alice}`);
        expect(arg.$y.RightOf).toBe(Id.Bob);
        expect(arg.$y.LeftOf).toBe(Id.Zach);
        expect(arg.$y.id).toBe(`${Id.Yair}`);
        expect(arg.$y.id).toBe(`${Id.Yair}`);
      },
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


  /**
   {
      nodes: [ [ 1, 'RightOf' ] ],
      vars: [ { name: 'id___$x', field: 0 }, { name: 'id___$y', field: 2 } ]
    }


   {
      nodes: [ [ 1, 'LeftOf' ] ],
      vars: [ { name: 'id___$y', field: 0 }, { name: 'id___$z', field: 2 } ]
    }


   {
      nodes: [ [ 1, 'RightOf' ] ],
      vars: [ { name: 'id___$y', field: 0 }, { name: 'id___$b', field: 2 } ]
    }


   {
      nodes: [ [ 1, 'Color' ], [ 2, 'red' ] ],
      vars: [ { name: 'id___$z', field: 0 } ]
    }


   {
      nodes: [ [ 1, 'LeftOf' ] ],
      vars: [ { name: 'id___$a', field: 0 }, { name: 'id___$d', field: 2 } ]
    }


   {
      nodes: [ [ 1, 'Color' ], [ 2, 'maize' ] ],
      vars: [ { name: 'id___$a', field: 0 } ]
    }


   {
      nodes: [ [ 1, 'Color' ], [ 2, 'blue' ] ],
      vars: [ { name: 'id___$b', field: 0 } ]
    }


   {
      nodes: [ [ 1, 'Color' ], [ 2, 'green' ] ],
      vars: [ { name: 'id___$c', field: 0 } ]
    }


   {
      nodes: [ [ 1, 'Color' ], [ 2, 'white' ] ],
      vars: [ { name: 'id___$d', field: 0 } ]
    }


   {
      nodes: [ [ 1, 'On' ], [ 2, 'table' ] ],
      vars: [ { name: 'id___$s', field: 0 } ]
    }




   */


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
        expect(args.$a.id).toBe(`${Id.Alice}`);
        expect(args.$b.id).toBe(`${Id.Bob}`);
        expect(args.$y.id).toBe(`${Id.Yair}`);
        expect(args.$y.LeftOf).toBe(Id.Zach);
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
    //TODO: I think because of the difference in our APIs (I don't have variable binding on values)
    // We get fundamentally difference condidtions that are resulting in different result lengths.
    // Pararules expects 1, so I should look into this deeper to be sure!
    expect(results.query().length).toBe(1);
  });
});
