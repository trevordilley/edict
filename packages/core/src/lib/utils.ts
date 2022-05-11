import {FACT_SCHEMA, WHAT_SCHEMA} from "@edict/core";
import * as _ from "lodash"

export const groupRuleById = <T extends FACT_SCHEMA>(rules: WHAT_SCHEMA<T>[]) => {
  const grouped = _.groupBy(rules, (r: WHAT_SCHEMA<T>) => r[0])
  let obj:any = {}
  return Object.keys(grouped).reduce((acc: any, g) => {
    acc[g] = grouped[g].map(x => x[1])
    return acc
  },{})
}
