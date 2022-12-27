```typescript
import { attr } from '@edict/core'

const schema = {
  Unique: {
    Session: {
      token: attr<string>(),
      username: attr<string>(),
    },
    $article: {},
    HomePage: {
      selectedTab: attr<string>(),
      tabs: attr<string[]>(),
    },
  },
  Joins: {
    $article: {
      name: attr<string>(),
      slug: attr<string>(),
      createDate: attr<Date>(),
      updateDate: attr<Date>(),
    },
    $author: {
      username: attr<string>(),
    },
  },
}

// Given the above schema passed into a function, we want to return something with the
// following type:
interface Result {
  Session: {
    insert: (attrs: { token?: string }) => void
    retract: {
      all: () => void
      token: () => void
    }
  }
  HomePage: {
    insert: (attrs: { selectedTab?: string; tabs?: string[] }) => void
    retract: {
      all: () => void
      selectedTab: () => void
      tabs: () => void
    }
  }
  $article: (id: string) => {
    insert: (attrs: {
      name?: string
      slug?: string
      createDate?: Date
      updateDate?: Date
    }) => void
    retract: {
      all: () => void
      name: () => void
      slug: () => void
      createDate: () => void
      updateDate: () => void
    }
  }
  $author: (id: string) => {
    insert: (attrs: { username?: string }) => void
    retract: {
      all: () => void
      username: () => void
    }
  }
}

const crazyTypeFn = <T>(schema: T) => {
  const ret = z.object({})
  Object.keys(schema).forEach((k) => {
    if (k.startsWith('$')) {
      ret.extend({
        [k]: z
          .function()
          .args(z.string())
          .returns(
            z.object({
              insert: z.function().args(),
            })
          ),
      })
    }
  })
}

const position = { position: z.object({ x: z.number(), y: z.number() }) }
const gameDevSchema = {
  Player: {
    xp: z.number(),
    money: z.number(),
  },
  $npc: {
    sprite: z.string(),
    hitPoints: z.number(),
    ...position,
  },
  $treasure: {
    ...position,
    money: z.number(),
  },
}

describe('TypeSafe inserts...', () => {
  const fakeEdict = <SCHEMA>(args: SCHEMA) => args
  it('simple insert', () => {
    const session = fakeEdict(schema)
    session.$article('id').name.insert('bob')
    session.$npc(23).hitPoints.insert(24)
    session.$npc(23).insert({
      hitPoints: 20,
      position: { x: 10, y: 12 },
    })

    const then = ({ $treasure }) => {
      $treasure.actions.hitPoints.insert()
    }

    expect(2).toBe(4)
  })
})
```
