import { Production, QueryFilter, Session } from '@edict/rete'
import { queryAll } from '../queryAll/queryAll'

export const subscribeToProduction = <T, U>(
  session: Session<T>,
  production: Production<T, U>,
  callback: (results: U[]) => void,
  filter?: QueryFilter<T>
): (() => void) => {
  const sub = { callback, filter }
  production.subscriptions.add(sub)
  if (!session.subscriptionsOnProductions.has(production.name)) {
    session.subscriptionsOnProductions.set(production.name, () => {
      production.subscriptions.forEach(({ callback, filter }) =>
        callback(queryAll(session, production, filter))
      )
    })
  }
  const ret = () => {
    production.subscriptions.delete(sub)
    if (production.subscriptions.size === 0) {
      session.subscriptionsOnProductions.delete(production.name)
    }
  }
  return ret
}
