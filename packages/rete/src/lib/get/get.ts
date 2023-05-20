import { Production, Session } from '@edict/rete'
import { hashIdAttrs } from '../utils'
import { bindingsToMatch } from '../bindingsToMatch/bindingsToMatch'

export const get = <T, U>(
  session: Session<T>,
  prod: Production<T, U>,
  i: number
): U | undefined => {
  const idAttrs = session.leafNodes.get(prod.name)?.matchIds.get(i)
  if (!idAttrs) return
  const idAttrsHash = hashIdAttrs(idAttrs)
  const vars = session.leafNodes.get(prod.name)?.matches.get(idAttrsHash)
    ?.match.bindings
  if (!vars) {
    console.warn('No vars??')
    return
  }
  return prod.convertMatchFn(bindingsToMatch(vars))
}
