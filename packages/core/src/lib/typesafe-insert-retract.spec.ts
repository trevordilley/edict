const attr = <T>() => {
  return undefined as unknown as T
}

const schema = {
  Unique: {
    Title: {
      name: attr<string>(),
      coins: attr<number>(),
      points: attr<number>(),
    },
    Menu: {
      pos: attr<{ x: number; y: number }>(),
    },
  },
  Joins: {
    $npc: {
      name: attr<string>(),
      health: attr<number>(),
      position: attr<{ x: number; y: number }>(),
    },
  },
}

// session.NPC.insert({}

const x = <Y extends Schemata>(args: Y): Mutate<Y> => {
  return 'blick' as unknown as Mutate<Y>
}
const session = x(schema)
