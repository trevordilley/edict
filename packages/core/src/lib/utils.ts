import { InsertEdictFact} from "@edict/core";
import * as _ from "lodash"
import {InternalFactRepresentation} from "@edict/types";

// export const groupRuleById = <S>(rules ) => {
//   const grouped = _.groupBy(rules, (r: WHAT_SCHEMA<T>) => r[0])
//   return Object.keys(grouped).reduce((acc: any, g) => {
//     acc[g] = grouped[g].map(x => x[1])
//     return acc
//   },{})
// }

export const groupFactById = <S>(facts: InternalFactRepresentation<S>[]) => {
  const grouped = _.groupBy(facts, (r  ) => r[0])
  return Object.keys(grouped).reduce((acc: any, g) => {
    acc[g] = grouped[g].map(x => x.slice(1))
    return acc
  },{})
}

export const insertFactToFact = <S>(insertion: InsertEdictFact<S>): InternalFactRepresentation<S> => {
  // TODO: This is just weird, it doesn't like the type and I don't get why. I'm sure I'll find out when I really
  // don't want to find out!
  // @ts-ignore
  return Object.keys(insertion).map((id:string) =>
    Object.keys(insertion[id]).map((attr: string) => {
        // @ts-ignore
      // Just doesn't like indexing with strings. I know it's an any
      const val: any = insertion[id][attr]
       return [id, attr, val] as [string, string, any]
      }
    )).flat()
}
