import { ConditionArgs, EnactionResults, QueryArgs } from '@edict/edict'
import { useEffect, useState } from 'react'

// Make sure to add this to Edict's README
export const useRuleOne = <
  SCHEMA extends object,
  T extends ConditionArgs<SCHEMA>
>(
  rule: EnactionResults<SCHEMA, T>,
  filter?: QueryArgs<SCHEMA, T>
) => {
  const [match, setMatch] = useState(rule.queryOne(filter))
  useEffect(() => rule.subscribeOne((d) => setMatch(d), filter))
  return match
}

export const useRule = <SCHEMA extends object, T extends ConditionArgs<SCHEMA>>(
  rule: EnactionResults<SCHEMA, T>,
  filter?: QueryArgs<SCHEMA, T>
) => {
  const [match, setMatch] = useState(rule.query(filter))
  useEffect(() => rule.subscribe((d) => setMatch(d), filter))
  return match
}
