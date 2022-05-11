
// const ruleSet = {
//   what: {
//     npc: ["x", "y", "speed", "name"],
//     time: [{dt: {then: false}}]
//   },
//   then: ({npc, time}: any) => {
//     npc.x = (npc.x * npc.speed) + time.dt
//     npc.y = (npc.x * npc.speed) + time.dt
//   },
//   when: ({npc}: any) => npc.health > 0,
//   thenFinally: ({npc}: any) => console.log(`Processed ${npc.name}`)
// }

// Do advanced what's later
// export type AdvancedWhatTerm<SCHEMA> = Record<keyof, {then: boolean}>
// export type What<SCHEMA> = Record<keyof SCHEMA, (string | AdvancedWhatTerm)[]>


// export type RecursiveKeyOf<TObj extends object> = {
//   [TKey in keyof TObj & (string | number)]:
//   TObj[TKey] extends any[] ? `${TKey}` :
//     TObj[TKey] extends object
//       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//       // @ts-ignore
//       ? `${TKey}` | `${TKey}.${RecursiveKeyOf<TObj[TKey]>}`
//       : `${TKey}`;
// }[keyof TObj & (string | number)];




export type FACT_SCHEMA = [string, string, any]
export type WHAT_SCHEMA<T extends FACT_SCHEMA> = [T[0], T[1]] | [T[0], T[1], {then: boolean}]
export interface Operations<T extends FACT_SCHEMA> {
  insert: (rule: T) => void
  retract: (rule: [T[0], T[1]]) => void
}
export interface Rules<FACT extends FACT_SCHEMA> {
  [key: string]: {
    what: WHAT_SCHEMA<FACT>[],
    when?: (bindings: any) => void
    then?: (bindings: any, operations: Operations<FACT>) => void
    thenFinally?: (bindings: any, operations: Operations<FACT>) => void
  }
}
