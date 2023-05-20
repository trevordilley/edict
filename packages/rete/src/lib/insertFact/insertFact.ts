import { AlphaNode, Fact, Session } from '@edict/rete'
import { fireRules } from '../fireRules/fireRules'
import { upsertFact } from '../upsertFact/upsertFact'
import { getAlphaNodesForFact } from '../getAlphaNodesForFact/getAlphaNodesForFact'

export const insertFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const nodes = new Set<AlphaNode<T>>()
  getAlphaNodesForFact(session, session.alphaNode, fact, true, nodes)
  upsertFact(session, fact, nodes)
  if (session.autoFire) {
    fireRules(session)
  }
}
