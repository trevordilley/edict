import { Production, QueryFilter, Session } from '@edict/rete'
import { bindingsToMatch } from '../bindingsToMatch/bindingsToMatch'

export const queryAll = <T, U>(
  session: Session<T>,
  prod: Production<T, U>,
  filter?: QueryFilter<T>
): U[] => {
  const result: U[] = []

  // TODO: Optimize result access?
  // I feel like we should cache the results of these matches until the next `fire()`
  // then make it easy to query the data via key map paths or something. Iterating over all
  // matches could become cumbersome for large data sets
  const matches = session.leafNodes.get(prod.name)?.matches ?? []
  for (const match of matches) {
    const { enabled, bindings } = match[1].match
    if (enabled && bindings) {
      const vars = bindingsToMatch(bindings)
      if (!filter) {
        result.push(prod.convertMatchFn(vars))
      } else {
        const filterKeys = filter.keys() // All keys must be present to match the value
        let hasAllFilterKeys = true

        for (const f of filterKeys) {
          if (!hasAllFilterKeys) break
          if (!vars.has(f)) {
            hasAllFilterKeys = false
            break
          } else {
            const fVal = filter.get(f)
            const vVal = vars.get(f)
            if (!fVal || !vVal || !fVal.includes(vVal)) {
              hasAllFilterKeys = false
              break
            }
          }
        }

        if (hasAllFilterKeys) {
          result.push(prod.convertMatchFn(vars))
        }
      }
    }
  }

  return result
}
